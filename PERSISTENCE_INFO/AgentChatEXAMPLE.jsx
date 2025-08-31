import { useAgent } from 'agents/react';
import { useEffect, useReducer, useState } from 'react';

// Streaming frame prefix constants
const FRAME_TEXT = '0';
const FRAME_TOOL_START = '9';
const FRAME_TOOL_RESULT = 'a';
const FRAME_USAGE_E = 'e';
const FRAME_USAGE_D = 'd';
const FRAME_META = 'f';

// Merge incoming streaming text intelligently to avoid duplicate concatenation
const mergeStreamingText = (previousText, incomingText) => {
  const prev = previousText || "";
  const next = incomingText || "";
  if (!prev) return next;
  if (!next) return prev;
  if (next.startsWith(prev)) return next;
  if (prev.endsWith(next)) return prev;
  const maxOverlap = Math.min(prev.length, next.length);
  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    if (prev.slice(-overlap) === next.slice(0, overlap)) {
      return prev + next.slice(overlap);
    }
  }
  return prev + next;
};

// Message model: { id, role: 'user'|'assistant'|'system'|'error'|'raw', status?, content?, tools?, usage?, data? }
const initialState = {
  messages: [],
  streams: new Map(),
  seq: 0,
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_USER_MESSAGE': {
      // Check if a user message with similar content already exists to prevent duplicates
      const existingMessage = state.messages.find(m => 
        m.role === 'user' && 
        m.content === action.content && 
        m.id.startsWith(action.id)
      );
      
      if (existingMessage) {
        return state; // Don't add duplicate
      }
      
      const userMessage = {
        id: `${action.id}:user:${Math.random().toString(36).substring(2)}`,
        role: 'user',
        status: 'complete',
        content: action.content,
      };
      return { ...state, messages: [...state.messages, userMessage] };
    }
    case 'STREAM_TEXT': {
      const { id, text } = action;
      const newStreams = new Map(state.streams);
      const stream = newStreams.get(id) || { content: '', tools: [], usage: null };
      stream.content = mergeStreamingText(stream.content, text);
      newStreams.set(id, stream);
      const withoutThisStream = state.messages.filter(m => !(m.role === 'assistant' && m.status === 'streaming' && m.id === id));
      const streamingMessage = {
        id,
        role: 'assistant',
        status: 'streaming',
        content: stream.content,
        tools: stream.tools,
      };
      return { ...state, streams: newStreams, messages: [...withoutThisStream, streamingMessage] };
    }
    case 'TOOL_START': {
      const { id, toolCall } = action;
      const newStreams = new Map(state.streams);
      const stream = newStreams.get(id) || { content: '', tools: [], usage: null };
      const exists = stream.tools.some(t => t.toolCallId === toolCall.toolCallId);
      if (!exists) {
        stream.tools.push({ ...toolCall, result: null });
      }
      newStreams.set(id, stream);
      const updatedMessages = state.messages.map(m => (m.role === 'assistant' && m.status === 'streaming' && m.id === id)
        ? { ...m, tools: stream.tools }
        : m);
      return { ...state, streams: newStreams, messages: updatedMessages };
    }
    case 'TOOL_RESULT': {
      const { id, toolResult } = action;
      const newStreams = new Map(state.streams);
      const stream = newStreams.get(id) || { content: '', tools: [], usage: null };
      const tool = stream.tools.find(t => t.toolCallId === toolResult.toolCallId);
      if (tool) {
        tool.result = toolResult.result;
      } else {
        stream.tools.push({ toolCallId: toolResult.toolCallId, toolName: toolResult.toolName, result: toolResult.result });
      }
      newStreams.set(id, stream);
      const updatedMessages = state.messages.map(m => (m.role === 'assistant' && m.status === 'streaming' && m.id === id)
        ? { ...m, tools: stream.tools }
        : m);
      return { ...state, streams: newStreams, messages: updatedMessages };
    }
    case 'USAGE': {
      const { id, usage } = action;
      const newStreams = new Map(state.streams);
      const stream = newStreams.get(id) || { content: '', tools: [], usage: null };
      stream.usage = usage;
      newStreams.set(id, stream);
      return { ...state, streams: newStreams };
    }
    case 'STREAM_COMPLETE': {
      const { id } = action;
      const newStreams = new Map(state.streams);
      const stream = newStreams.get(id);
      if (!stream) {
        return { ...state };
      }
      newStreams.delete(id);
      const withoutStreaming = state.messages.filter(m => !(m.role === 'assistant' && m.status === 'streaming' && m.id === id));
      const completeMessage = {
        id,
        role: 'assistant',
        status: 'complete',
        content: stream.content,
        tools: stream.tools,
        usage: stream.usage,
      };
      return { ...state, streams: newStreams, messages: [...withoutStreaming, completeMessage] };
    }
    case 'ADD_SYSTEM': {
      const { content } = action;
      const nextSeq = state.seq + 1;
      return { ...state, seq: nextSeq, messages: [...state.messages, { id: `system:${nextSeq}`, role: 'system', content }] };
    }
    case 'ADD_ERROR': {
      const { content } = action;
      const nextSeq = state.seq + 1;
      return { ...state, seq: nextSeq, messages: [...state.messages, { id: `error:${nextSeq}`, role: 'error', content }] };
    }
    case 'ADD_RAW': {
      const { data } = action;
      const nextSeq = state.seq + 1;
      return { ...state, seq: nextSeq, messages: [...state.messages, { id: `raw:${nextSeq}`, role: 'raw', data }] };
    }
    case 'SET_MESSAGES': {
      return { ...state, messages: action.messages };
    }
    default:
      return state;
  }
}

export function AgentChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [inputValue, setInputValue] = useState("");
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8)); // Consistent session ID
  
  const agent = useAgent({
    agent: "chat",
    host: "localhost:5174"
  });

  // Fetch initial messages on mount to restore conversation history
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
        const getMessagesUrl = new URL(agentUrl);
        getMessagesUrl.pathname += "/get-messages";
        
        const response = await fetch(getMessagesUrl.toString());
        if (response.ok) {
          const initialMessages = await response.json();
          if (initialMessages && initialMessages.length > 0) {
            // Convert server messages to our format
            const convertedMessages = initialMessages.map((msg, index) => ({
              id: msg.id || `restored-${index}`,
              role: msg.role,
              status: 'complete',
              content: msg.content,
              tools: msg.toolInvocations || [],
              usage: msg.usage
            }));
            
            // Initialize state with fetched messages
            dispatch({ type: 'SET_MESSAGES', messages: convertedMessages });
          }
        }
      } catch (error) {
        console.log('Failed to fetch initial messages:', error);
      }
    };
    
    fetchInitialMessages();
  }, [agent]);

  useEffect(() => {
    const handleStreamingResponse = (data) => {
      const { id, body, done } = data;
      
      if (done && body === "") {
        dispatch({ type: 'STREAM_COMPLETE', id });
        return;
      }

      // Parse streaming data
      if (body && body.includes(':')) {
        const colonIndex = body.indexOf(':');
        const prefix = body.substring(0, colonIndex);
        const content = body.substring(colonIndex + 1).replace(/\n$/, ''); // Remove trailing newline
        
        if (!content && prefix !== FRAME_META) return; // Skip empty content except for 'f' prefix

        switch (prefix) {
          case FRAME_TEXT: {
            try {
              const text = JSON.parse(content);
              dispatch({ type: 'STREAM_TEXT', id, text });
            } catch (e) {
              dispatch({ type: 'STREAM_TEXT', id, text: content });
            }
            break;
          }
          case FRAME_TOOL_START: {
            try {
              const toolCall = JSON.parse(content);
              dispatch({ type: 'TOOL_START', id, toolCall });
            } catch (e) {}
            break;
          }
          case FRAME_TOOL_RESULT: {
            try {
              const toolResult = JSON.parse(content);
              dispatch({ type: 'TOOL_RESULT', id, toolResult });
            } catch (e) {}
            break;
          }
          case FRAME_USAGE_E:
          case FRAME_USAGE_D: {
            try {
              const usage = JSON.parse(content);
              dispatch({ type: 'USAGE', id, usage });
            } catch (e) {}
            break;
          }
          case FRAME_META: {
            break;
          }
          default:
            break;
        }
      }
    };

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "cf_agent_use_chat_response") {
          handleStreamingResponse(data);
        } else {
          // Handle other message types
          dispatch({ type: 'ADD_SYSTEM', content: data.type });
        }
      } catch (e) {
        dispatch({ type: 'ADD_RAW', data: event.data });
      }
    };

    agent.onmessage = handleMessage;
    agent.onopen = () => dispatch({ type: 'ADD_SYSTEM', content: 'Connection opened' });
    agent.onerror = (error) => dispatch({ type: 'ADD_ERROR', content: `Error: ${error}` });
    agent.onclose = () => dispatch({ type: 'ADD_SYSTEM', content: 'Connection closed' });

    return () => {
      agent.onmessage = null;
      agent.onopen = null;
      agent.onerror = null;
      agent.onclose = null;
    };
  }, [agent]);

  const sendChatMessage = (content) => {
    const messageId = Math.random().toString(36).substring(2, 8); // Unique message ID
    const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
    
    // Build conversation history from current messages
    const conversationHistory = state.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt || new Date().toISOString()
      }));
    
    // Add the new user message
    const newUserMessage = {
      id: Math.random().toString(36).substring(2, 8),
      role: "user",
      content: content,
      createdAt: new Date().toISOString()
    };
    
    const message = {
      id: messageId, // Use unique message ID for WebSocket
      type: "cf_agent_use_chat_request",
      url: agentUrl,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...conversationHistory, newUserMessage],
          sessionId: sessionId // Include session ID for state persistence
        })
      }
    };
    
    agent.send(JSON.stringify(message));
    dispatch({ type: 'ADD_USER_MESSAGE', id: messageId, content });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendChatMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="agent-chat" style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>Agent Chat Test</h3>
      
      {/* Test Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => sendChatMessage("Hello")} style={{ marginRight: '10px' }}>
          Send Hello
        </button>
        <button onClick={() => sendChatMessage("Please call the debugAgentState tool")} style={{ marginRight: '10px' }}>
          Debug State
        </button>
        <button onClick={() => sendChatMessage("Please start a new TicTacToe game")} style={{ marginRight: '10px' }}>
          Start TicTacToe
        </button>
        <button onClick={() => sendChatMessage("Please get the local time for New York")} style={{ marginRight: '10px' }}>
          Get Time
        </button>
        <button onClick={() => dispatch({ type: 'ADD_SYSTEM', content: 'Messages cleared' })} style={{ marginRight: '10px' }}>
          Clear Messages
        </button>
      </div>

      {/* Messages Display */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Chat Messages ({state.messages.length})</h4>
        <div style={{ 
          height: '400px', 
          overflowY: 'scroll', 
          border: '1px solid #ccc', 
          padding: '10px',
          backgroundColor: '#f5f5f5'
        }}>
          {state.messages.map((msg) => (
            <div key={msg.id} style={{ 
              marginBottom: '10px',
              padding: '8px',
              borderRadius: '5px',
              backgroundColor: 
                msg.role === 'user' ? '#e3f2fd' : 
                (msg.role === 'assistant' && msg.status === 'complete') ? '#e8f5e8' :
                (msg.role === 'assistant' && msg.status === 'streaming') ? '#fff3e0' :
                msg.role === 'system' ? '#f0f0f0' :
                msg.role === 'error' ? '#ffebee' : '#f3e5f5'
            }}>
              {msg.role === 'user' && (
                <div>
                  <strong>👤 You:</strong>
                  <div style={{ marginTop: '5px' }}>
                    {msg.content}
                  </div>
                </div>
              )}
              
              {msg.role === 'assistant' && (
                <div>
                  <strong>🤖 Assistant{msg.status === 'streaming' ? ' (typing...)' : ''}:</strong>
                  <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                  {msg.tools && msg.tools.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '5px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                      <strong>🔧 Tools used:</strong>
                      {msg.tools.map((tool, i) => (
                        <div key={i} style={{ marginTop: '5px', fontSize: '12px' }}>
                          <strong>{tool.toolName}</strong>
                          {tool.result && (
                            <pre style={{ margin: '3px 0', fontSize: '11px', maxHeight: '100px', overflow: 'auto' }}>
                              {JSON.stringify(tool.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.usage && (
                    <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
                      Tokens: {msg.usage.promptTokens} + {msg.usage.completionTokens}
                    </div>
                  )}
                </div>
              )}
              
              {msg.role === 'system' && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <strong>🔧 System:</strong> {msg.content}
                </div>
              )}
              
              {msg.role === 'raw' && (
                <div>
                  <strong>[Raw]:</strong>
                  <pre style={{ margin: '5px 0', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                    {msg.data}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          style={{ width: '400px', padding: '8px' }}
        />
        <button type="submit" style={{ marginLeft: '10px', padding: '8px' }}>
          Send
        </button>
      </form>
    </div>
  );
}