import { useAgent } from 'agents/react';
import { useEffect, useState, useRef } from 'react';

export function AgentChat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [currentStreams, setCurrentStreams] = useState(new Map());
  const currentStreamsRef = useRef(new Map());
  
  const agent = useAgent({
    agent: "chat",
    host: "localhost:5174"
  });

  useEffect(() => {
    console.log('Agent:', agent);
    
    const handleStreamingResponse = (data) => {
      const { id, body, done } = data;
      
      if (done && body === "") {
        // Stream completed
        const stream = currentStreams.get(id);
        if (stream) {
          setMessages(prev => [...prev, { 
            type: 'assistant_complete', 
            data: {
              content: stream.content,
              tools: stream.tools,
              usage: stream.usage
            }
          }]);
          setCurrentStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
        }
        return;
      }

      // Parse streaming data
      if (body && body.includes(':')) {
        const colonIndex = body.indexOf(':');
        const prefix = body.substring(0, colonIndex);
        const content = body.substring(colonIndex + 1).replace(/\n$/, ''); // Remove trailing newline
        
        if (!content) return; // Skip empty content

        let updatedStream = null;
        
        setCurrentStreams(prev => {
          const newMap = new Map(prev);
          const stream = newMap.get(id) || { content: '', tools: [], usage: null };
          
          if (prefix === '0') {
            // Text content
            try {
              const text = JSON.parse(content);
              stream.content += text;
            } catch (e) {
              stream.content += content;
            }
          } else if (prefix === '9') {
            // Tool call start
            try {
              const toolCall = JSON.parse(content);
              stream.tools.push({ ...toolCall, result: null });
            } catch (e) {}
          } else if (prefix === 'a') {
            // Tool call result
            try {
              const toolResult = JSON.parse(content);
              const tool = stream.tools.find(t => t.toolCallId === toolResult.toolCallId);
              if (tool) {
                tool.result = toolResult.result;
              }
            } catch (e) {}
          } else if (prefix === 'e' || prefix === 'd') {
            // Usage info
            try {
              const usage = JSON.parse(content);
              stream.usage = usage;
            } catch (e) {}
          } else if (prefix === 'f') {
            // Message frame/metadata - can be ignored for display
            return prev; // Don't update for metadata
          }
          
          newMap.set(id, stream);
          currentStreamsRef.current = newMap;
          updatedStream = stream;
          console.log(`Updated stream for ${id}:`, { content: stream.content, toolCount: stream.tools.length });
          return newMap;
        });

        // Update live display - but only for content that should trigger updates
        if (prefix !== 'f' && updatedStream) {
          setMessages(prev => {
            const filtered = prev.filter(m => m.type !== 'streaming' || m.id !== id);
            return [...filtered, { 
              type: 'streaming', 
              id,
              data: {
                content: updatedStream.content,
                tools: updatedStream.tools
              }
            }];
          });
        }
      }
    };

    const handleMessage = (event) => {
      console.log('Raw WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed WebSocket message:', data.type, data);
        
        if (data.type === "cf_agent_use_chat_response") {
          handleStreamingResponse(data);
        } else {
          // Handle other message types (state, mcp, etc.)
          console.log('Non-chat message:', data);
          setMessages(prev => [...prev, { type: 'system', data }]);
        }
      } catch (e) {
        console.log('Failed to parse WebSocket message:', e, event.data);
        setMessages(prev => [...prev, { type: 'raw', data: event.data }]);
      }
    };

    agent.onmessage = handleMessage;

    agent.onopen = () => {
      console.log("Connection opened");
      setMessages(prev => [...prev, { type: 'system', data: 'Connection opened' }]);
    };

    agent.onerror = (error) => {
      console.log("Error:", error);
      setMessages(prev => [...prev, { type: 'error', data: `Error: ${error}` }]);
    };

    agent.onclose = () => {
      console.log("Connection closed");
      setMessages(prev => [...prev, { type: 'system', data: 'Connection closed' }]);
    };

    return () => {
      // Cleanup event handlers
      agent.onmessage = null;
      agent.onopen = null;
      agent.onerror = null;
      agent.onclose = null;
    };
  }, [agent]);

  // Emulate how useAgentChat sends messages
  const sendChatMessage = (content) => {
    const id = Math.random().toString(36).substring(2, 8); // Match nanoid(8)
    const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
    
    const message = {
      id,
      type: "cf_agent_use_chat_request",
      url: agentUrl,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              id: Math.random().toString(36).substring(2, 8),
              role: "user",
              content: content,
              createdAt: new Date().toISOString()
            }
          ]
        })
      }
    };
    
    const messageString = JSON.stringify(message);
    console.log('Sending chat message:', message);
    console.log('Message string:', messageString);
    agent.send(messageString);
    setMessages(prev => [...prev, { type: 'sent', data: content }]);
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
        <button onClick={() => setMessages([])} style={{ marginRight: '10px' }}>
          Clear Messages
        </button>
      </div>


      {/* Messages Display */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Chat Messages ({messages.length})</h4>
        <div style={{ 
          height: '400px', 
          overflowY: 'scroll', 
          border: '1px solid #ccc', 
          padding: '10px',
          backgroundColor: '#f5f5f5'
        }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              padding: '8px',
              borderRadius: '5px',
              backgroundColor: 
                msg.type === 'sent' ? '#e3f2fd' : 
                msg.type === 'assistant_complete' ? '#e8f5e8' :
                msg.type === 'streaming' ? '#fff3e0' :
                msg.type === 'system' ? '#f0f0f0' :
                msg.type === 'error' ? '#ffebee' : '#f3e5f5'
            }}>
              {msg.type === 'sent' && (
                <div>
                  <strong>👤 You:</strong>
                  <div style={{ marginTop: '5px' }}>
                    {typeof msg.data === 'string' ? msg.data : 
                     msg.data.init ? JSON.parse(msg.data.init.body).messages[0].content : 
                     JSON.stringify(msg.data)}
                  </div>
                </div>
              )}
              
              {(msg.type === 'assistant_complete' || msg.type === 'streaming') && (
                <div>
                  <strong>🤖 Assistant{msg.type === 'streaming' ? ' (typing...)' : ''}:</strong>
                  <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>
                    {msg.data.content}
                  </div>
                  {msg.data.tools && msg.data.tools.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '5px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                      <strong>🔧 Tools used:</strong>
                      {msg.data.tools.map((tool, i) => (
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
                  {msg.data.usage && (
                    <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
                      Tokens: {msg.data.usage.promptTokens} + {msg.data.usage.completionTokens}
                    </div>
                  )}
                </div>
              )}
              
              {msg.type === 'system' && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <strong>🔧 System:</strong> {typeof msg.data === 'string' ? msg.data : msg.data.type}
                </div>
              )}
              
              {msg.type === 'raw' && (
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
          Send via WebSocket
        </button>
      </form>
    </div>
  );
}