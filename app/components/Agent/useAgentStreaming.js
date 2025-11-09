import { useEffect } from 'react';
import { FRAME_TEXT, FRAME_TOOL_START, FRAME_TOOL_RESULT, FRAME_USAGE_E, FRAME_USAGE_D, FRAME_META } from './chatReducer';

export function useAgentStreaming(agent, dispatchChat, onComplete, handleError) {
  useEffect(() => {
    if (!agent) return;

    const handleStreamingResponse = (data) => {
      const { id, body, done } = data;

      if (done && body === "") {
        dispatchChat({ type: 'STREAM_COMPLETE', id });
        if (typeof onComplete === 'function') onComplete();
        return;
      }

      if (body && body.includes(':')) {
        const colonIndex = body.indexOf(':');
        const prefix = body.substring(0, colonIndex);
        const content = body.substring(colonIndex + 1).replace(/\n$/, '');

        if (!content && prefix !== FRAME_META) return;

        switch (prefix) {
          case FRAME_TEXT: {
            try {
              const text = JSON.parse(content);
              dispatchChat({ type: 'STREAM_TEXT', id, text });
            } catch (e) {
              console.warn('[useAgentStreaming] Failed to parse text, using raw content:', e);
              dispatchChat({ type: 'STREAM_TEXT', id, text: content });
            }
            break;
          }
          case FRAME_TOOL_START: {
            try {
              const toolCall = JSON.parse(content);
              dispatchChat({ type: 'TOOL_START', id, toolCall });
            } catch (e) {
              console.warn('[useAgentStreaming] Failed to parse tool start:', e);
              if (handleError) handleError(e, 'Tool Start Parsing');
            }
            break;
          }
          case FRAME_TOOL_RESULT: {
            try {
              const toolResult = JSON.parse(content);
              dispatchChat({ type: 'TOOL_RESULT', id, toolResult });
            } catch (e) {
              console.warn('[useAgentStreaming] Failed to parse tool result:', e);
              if (handleError) handleError(e, 'Tool Result Parsing');
            }
            break;
          }
          case FRAME_USAGE_E:
          case FRAME_USAGE_D: {
            try {
              const usage = JSON.parse(content);
              dispatchChat({ type: 'USAGE', id, usage });
            } catch (e) {
              console.warn('[useAgentStreaming] Failed to parse usage:', e);
            }
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
        }
        // NEW: Handle message ID mapping from server
        else if (data.type === "cf_agent_message_ids") {
          const idMap = {};
          data.messages.forEach(msg => {
            if (msg.tempId && msg.id) {
              idMap[msg.tempId] = msg.id;
            }
          });

          if (Object.keys(idMap).length > 0) {
            console.log('🔄 Received ID mappings from server:', idMap);
            dispatchChat({ type: 'REPLACE_MESSAGE_IDS', idMap });
          }
        }
        // Handle full message sync from server
        else if (data.type === "cf_agent_chat_messages") {
          console.log('📥 Received full message sync from server');
          dispatchChat({ type: 'SET_MESSAGES', messages: data.messages });
        }
        else if (data.type !== "cf_agent_mcp_servers" && data.type !== "cf_agent_state") {
          dispatchChat({ type: 'ADD_SYSTEM', content: data.type });
        }
      } catch (e) {
        console.error('❌ Error handling WebSocket message:', e);
        if (handleError) handleError(e, 'WebSocket Message');
      }
    };

    agent.onmessage = handleMessage;
    agent.onopen = () => {
      console.log('✅ WebSocket connection opened');
      dispatchChat({ type: 'ADD_SYSTEM', content: 'Connection opened' });
    };
    agent.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      if (handleError) handleError(error, 'WebSocket Connection');
      dispatchChat({ type: 'ADD_ERROR', content: `Error: ${error}` });
    };
    agent.onclose = () => {
      console.log('🔌 WebSocket connection closed');
      dispatchChat({ type: 'ADD_SYSTEM', content: 'Connection closed' });
    };

    return () => {
      agent.onmessage = null;
      agent.onopen = null;
      agent.onerror = null;
      agent.onclose = null;
    };
  }, [agent, dispatchChat, onComplete, handleError]);
}


