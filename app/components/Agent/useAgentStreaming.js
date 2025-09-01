import { useEffect } from 'react';
import { FRAME_TEXT, FRAME_TOOL_START, FRAME_TOOL_RESULT, FRAME_USAGE_E, FRAME_USAGE_D, FRAME_META } from './chatReducer';

export function useAgentStreaming(agent, dispatchChat, onComplete) {
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
              dispatchChat({ type: 'STREAM_TEXT', id, text: content });
            }
            break;
          }
          case FRAME_TOOL_START: {
            try {
              const toolCall = JSON.parse(content);
              dispatchChat({ type: 'TOOL_START', id, toolCall });
            } catch (e) {}
            break;
          }
          case FRAME_TOOL_RESULT: {
            try {
              const toolResult = JSON.parse(content);
              dispatchChat({ type: 'TOOL_RESULT', id, toolResult });
            } catch (e) {}
            break;
          }
          case FRAME_USAGE_E:
          case FRAME_USAGE_D: {
            try {
              const usage = JSON.parse(content);
              dispatchChat({ type: 'USAGE', id, usage });
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
        } else if (data.type !== "cf_agent_mcp_servers" && data.type !== "cf_agent_state") {
          dispatchChat({ type: 'ADD_SYSTEM', content: data.type });
        }
      } catch (e) {
      }
    };

    agent.onmessage = handleMessage;
    agent.onopen = () => dispatchChat({ type: 'ADD_SYSTEM', content: 'Connection opened' });
    agent.onerror = (error) => dispatchChat({ type: 'ADD_ERROR', content: `Error: ${error}` });
    agent.onclose = () => dispatchChat({ type: 'ADD_SYSTEM', content: 'Connection closed' });

    return () => {
      agent.onmessage = null;
      agent.onopen = null;
      agent.onerror = null;
      agent.onclose = null;
    };
  }, [agent, dispatchChat, onComplete]);
}


