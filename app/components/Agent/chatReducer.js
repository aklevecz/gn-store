// Streaming frame prefix constants
export const FRAME_TEXT = '0';
export const FRAME_TOOL_START = '9';
export const FRAME_TOOL_RESULT = 'a';
export const FRAME_USAGE_E = 'e';
export const FRAME_USAGE_D = 'd';
export const FRAME_META = 'f';

export const initialChatState = {
  messages: [],
  streams: new Map(),
  seq: 0,
};

export const mergeStreamingText = (previousText, incomingText) => {
  const prev = previousText || "";
  const next = incomingText || "";
  if (!prev) return next;
  if (!next) return prev;
  if (next.startsWith(prev) && next.length > prev.length) {
    return next;
  }
  return prev + next;
};

function normalizeMessages(messages) {
  const seenIds = new Set();
  return (messages || []).map((message, index) => {
    let id = message?.id;
    if (!id) {
      const role = message?.role || 'message';
      id = `${role}:${index + 1}`;
    }
    if (seenIds.has(id)) {
      let counter = 1;
      let uniqueId = `${id}#${counter}`;
      while (seenIds.has(uniqueId)) {
        counter += 1;
        uniqueId = `${id}#${counter}`;
      }
      id = uniqueId;
    }
    seenIds.add(id);
    return { ...message, id };
  });
}

function getMaxSeqFromMessages(messages) {
  let maxSeq = 0;
  for (const m of messages || []) {
    if (m && typeof m.id === 'string') {
      const match = m.id.match(/^(?:user|assistant|system|error):(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && n > maxSeq) {
          maxSeq = n;
        }
      }
    }
  }
  return maxSeq;
}

export function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_USER_MESSAGE': {
      const nextSeq = state.seq + 1;
      const userMessage = {
        id: `user:${nextSeq}`,
        role: 'user',
        status: 'complete',
        content: action.content,
      };
      return { ...state, seq: nextSeq, messages: [...state.messages, userMessage] };
    }
    case 'STREAM_TEXT': {
      const { id, text } = action;
      const existingStream = state.streams.get(id);
      const stream = existingStream
        ? { ...existingStream }
        : { content: '', tools: [], usage: null, messageKey: null };
      let seq = state.seq;
      if (!stream.messageKey) {
        seq += 1;
        stream.messageKey = `assistant:${seq}`;
      }
      stream.content = mergeStreamingText(stream.content, text);
      const newStreams = new Map(state.streams);
      newStreams.set(id, stream);
      const withoutThisStream = state.messages.filter(
        m => !(m.role === 'assistant' && m.status === 'streaming' && m.id === stream.messageKey)
      );
      const streamingMessage = {
        id: stream.messageKey,
        role: 'assistant',
        status: 'streaming',
        content: stream.content,
        tools: stream.tools,
      };
      return { ...state, seq, streams: newStreams, messages: [...withoutThisStream, streamingMessage] };
    }
    case 'TOOL_START': {
      const { id, toolCall } = action;
      const newStreams = new Map(state.streams);
      const baseStream = newStreams.get(id) || { content: '', tools: [], usage: null };
      const stream = { ...baseStream, tools: [...baseStream.tools] };
      const exists = stream.tools.some(t => t.toolCallId === toolCall.toolCallId);
      if (!exists) {
        stream.tools.push({ ...toolCall, result: null });
      }
      newStreams.set(id, stream);
      const updatedMessages = state.messages.map(m => (
        m.role === 'assistant' && m.status === 'streaming' && m.id === (stream.messageKey || m.id)
      ) ? { ...m, tools: stream.tools } : m);
      return { ...state, streams: newStreams, messages: updatedMessages };
    }
    case 'TOOL_RESULT': {
      const { id, toolResult } = action;
      const newStreams = new Map(state.streams);
      const baseStream = newStreams.get(id) || { content: '', tools: [], usage: null };
      const stream = { ...baseStream, tools: [...baseStream.tools] };
      const tool = stream.tools.find(t => t.toolCallId === toolResult.toolCallId);
      if (tool) {
        tool.result = toolResult.result;
      } else {
        stream.tools.push({ toolCallId: toolResult.toolCallId, toolName: toolResult.toolName, result: toolResult.result });
      }
      newStreams.set(id, stream);
      const updatedMessages = state.messages.map(m => (
        m.role === 'assistant' && m.status === 'streaming' && m.id === (stream.messageKey || m.id)
      ) ? { ...m, tools: stream.tools } : m);
      return { ...state, streams: newStreams, messages: updatedMessages };
    }
    case 'USAGE': {
      const { id, usage } = action;
      const newStreams = new Map(state.streams);
      const stream = { ...(newStreams.get(id) || { content: '', tools: [], usage: null }), usage };
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
      let seq = state.seq;
      if (!stream.messageKey) {
        seq += 1;
        stream.messageKey = `assistant:${seq}`;
      }
      newStreams.delete(id);
      const withoutStreaming = state.messages.filter(m => !(m.role === 'assistant' && m.status === 'streaming' && m.id === stream.messageKey));
      const completeMessage = {
        id: stream.messageKey,
        role: 'assistant',
        status: 'complete',
        content: stream.content,
        tools: stream.tools,
        usage: stream.usage,
      };
      return { ...state, seq, streams: newStreams, messages: [...withoutStreaming, completeMessage] };
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
    case 'CLEAR_MESSAGES': {
      return initialChatState;
    }
    case 'SET_MESSAGES': {
      const normalized = normalizeMessages(action.messages);
      const maxSeq = getMaxSeqFromMessages(normalized);
      return { ...state, messages: normalized, seq: Math.max(state.seq, maxSeq), streams: new Map() };
    }
    default:
      return state;
  }
}


