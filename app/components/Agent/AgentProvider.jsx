import { createContext, useContext, useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { getAgentData, saveAgentData } from '~/lib/agent-storage';
import { useAgent } from 'agents/react';

const AgentContext = createContext(null);

const HOST = "localhost:5174"
const AGENT_NAME = "chat"

export const CHARACTERS = {
  GROOVY: {
    id: 'groovy',
    name: 'Groovy',
    description: 'The music enthusiast - vinyl expert and music historian',
    defaultImage: '/characters/groovy-stand.png',
    moods: {
      happy: '/characters/groovy-thumbsup.png',
      neutral: '/characters/groovy-stand.png',
      sad: '/characters/groovy-sad.png',
      excited: '/characters/groovy-jump.png',
    }
  },
  GLOBBY: {
    id: 'globby',
    name: 'Globby',
    description: 'The eco-warrior - sustainability expert and green living guru',
    defaultImage: '/characters/globby-thumbsup.png',
    moods: {
      happy: '/characters/globby-thumbsup.png',
      neutral: '/characters/globby-thumbsup.png',
      sad: '/characters/globby-sad.png',
      excited: '/characters/globby-jump.png',
    }
  }
};

export const ITEMS = {
  // Active item
  COFFEE: { id: 'coffee', name: 'Coffee', effect: { energy: 20, happiness: 10, intelligence: 5 }, type: 'beverage' },

  // Preserved items (commented out for now)
  // // Music items
  // VINYL_RECORD: { id: 'vinyl', name: 'Vinyl Record', effect: { happiness: 15 }, type: 'music' },
  // CONCERT_TICKET: { id: 'ticket', name: 'Concert Ticket', effect: { happiness: 25 }, type: 'music' },
  // MUSIC_NOTE: { id: 'note', name: 'Music Note', effect: { happiness: 5 }, type: 'music' },

  // // Eco items
  // SOLAR_POWER: { id: 'solar', name: 'Solar Power', effect: { energy: 20 }, type: 'eco' },
  // RECYCLED_MATERIALS: { id: 'recycled', name: 'Recycled Materials', effect: { intelligence: 10 }, type: 'eco' },
  // ORGANIC_SNACK: { id: 'organic', name: 'Organic Snack', effect: { energy: 10, happiness: 5 }, type: 'eco' },
  // PLANT_SEEDS: { id: 'seeds', name: 'Plant Seeds', effect: { happiness: 10, intelligence: 5 }, type: 'eco' },
  // WATER_BOTTLE: { id: 'water', name: 'Reusable Water Bottle', effect: { energy: 15 }, type: 'eco' },
  // COMPOST: { id: 'compost', name: 'Compost', effect: { intelligence: 15 }, type: 'eco' },
};

const DEFAULT_STATS = {
  happiness: 75,
  energy: 75,
  intelligence: 50,
};

const MAX_STAT = 100;
const MIN_STAT = 0;

// Streaming frame prefix constants (from AgentChat.jsx)
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

// WE NEED TO IMPROVE THIS
// Ensure message IDs are unique and derive the maximum numeric sequence
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

// Shouldn't need this either
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

// Chat reducer from AgentChat.jsx
const initialChatState = {
  messages: [],
  streams: new Map(),
  seq: 0,
};

// I don't completely understand what is going on in most of the cases in this reducer
function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_USER_MESSAGE': {
      // Id should come from server maybe?
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
      const newStreams = new Map(state.streams);
      const stream = newStreams.get(id) || { content: '', tools: [], usage: null, messageKey: null };
      let seq = state.seq;
      if (!stream.messageKey) {
        seq += 1;
        stream.messageKey = `assistant:${seq}`;
      }
      stream.content = mergeStreamingText(stream.content, text);
      newStreams.set(id, stream);
      const withoutThisStream = state.messages.filter(m => !(m.role === 'assistant' && m.status === 'streaming' && m.id === stream.messageKey));
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
      // NOTE: Restored/initial messages from the server have, at times, come back with
      // duplicate or non-sequential IDs (e.g., repeated `user:4`, `assistant:7`). This caused:
      // 1) React key collisions in the chat list, resulting in duplicated/omitted DOM nodes
      // 2) Server-side issues where message identity/ordering became ambiguous
      //
      // As a stopgap, we normalize all incoming messages to ensure unique IDs and we advance
      // the local `seq` to at least the highest numeric suffix we see. This keeps React keys
      // stable and prevents ID clashes when we append new `user:`/`assistant:` messages.
      //
      // Longer term: we should switch to a robust, server-assigned unique ID scheme (e.g. UUIDs)
      // and avoid overloading IDs with role-based prefixes for sequencing. The server should also
      // guarantee consistent ordering and uniqueness so the client can trust message identity
      // without client-side repairs.
      const normalized = normalizeMessages(action.messages);
      const maxSeq = getMaxSeqFromMessages(normalized);
      return { ...state, messages: normalized, seq: Math.max(state.seq, maxSeq), streams: new Map() };
    }
    default:
      return state;
  }
}

function clampStat(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

function getMood(stats) {
  const avgMood = (stats.happiness + stats.energy) / 2;
  if (avgMood >= 80) return 'excited';
  if (avgMood >= 60) return 'happy';
  if (avgMood >= 40) return 'neutral';
  return 'sad';
}

export function AgentProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [inventory, setInventory] = useState([]);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [insights, setInsights] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [playingAnimation, setPlayingAnimation] = useState(null); // Track which animation is playing

  // Chat state management with reducer (from AgentChat.jsx)
  const [chatState, dispatchChat] = useReducer(chatReducer, initialChatState);
  const [sessionId] = useState(() => {
    const id = Math.random().toString(36).substring(2, 8);
    console.log('🆔 AgentProvider: Created session ID:', id);
    return id;
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  // Create unique instance name for this user session
  const [instanceName] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    
    const storageKey = 'gn-friend-user-session';
    let userSession = localStorage.getItem(storageKey);
    
    if (!userSession) {
      userSession = `user-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(storageKey, userSession);
      console.log('🆔 Generated new user session:', userSession);
    } else {
      console.log('🆔 Using existing user session:', userSession);
    }
    
    return userSession;
  });

  // Initialize agent connection with unique instance name
  const agent = useAgent({
    agent: AGENT_NAME,
    host: HOST,
    name: instanceName  // This creates separate DO instances per user
  });

  // Server state fetching for periodic sync
  const fetchServerState = useCallback(async () => {
    if (!agent?._url) return null;
    
    try {
      const url = new URL(agent._url.replace("ws://", "http://").replace("wss://", "https://"));
      url.pathname += '/api/debug/state';
      
      console.log('🔍 Fetching debug state from:', url.toString());
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.log('❌ Debug state fetch failed with status:', response.status);
        return null;
      }
      
      const serverState = await response.json();
      console.log('📊 Debug state response:', serverState);
      return serverState.character;
    } catch (error) {
      console.error('Failed to fetch server state:', error);
      return null;
    }
  }, [agent]);

  // Debug: Log the agent URL to understand routing
  useEffect(() => {
    if (agent._url) {
      console.log('🔗 AgentProvider: Agent URL:', agent._url);
    }
  }, [agent._url]);

  // Initial server state fetch on agent connection
  useEffect(() => {
    const fetchInitialServerState = async () => {
      if (!agent?._url || !selectedCharacter) return;
      
      console.log('🔄 Fetching initial server state...');
      const serverCharacter = await fetchServerState();
      if (!serverCharacter) return;
      
      const serverLastSync = serverCharacter.lastSync || 0;
      const localLastSync = selectedCharacter.lastSync || 0;
      
      if (serverLastSync > localLastSync) {
        console.log('🔄 Found newer server state on connection, syncing...');
        
        // Update character if it changed
        if (serverCharacter.id !== selectedCharacter.id) {
          const newCharacter = CHARACTERS[serverCharacter.id];
          if (newCharacter) {
            setSelectedCharacter({ ...newCharacter, lastSync: serverLastSync });
          }
        } else {
          setSelectedCharacter(prev => ({ ...prev, lastSync: serverLastSync }));
        }
        
        // Update stats
        setStats(serverCharacter.stats);
        setLastInteraction(serverLastSync);
      }
    };
    
    if (agent._url && selectedCharacter && isInitialized) {
      fetchInitialServerState();
    }
  }, [agent._url, selectedCharacter, isInitialized, fetchServerState]);

  // Fetch initial messages on mount to restore conversation history
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        console.log('💬 AgentProvider: Fetching initial messages for session:', sessionId);
        const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
        const getMessagesUrl = new URL(agentUrl);
        getMessagesUrl.pathname += "/get-messages";

        console.log('🔗 AgentProvider: Fetching from URL:', getMessagesUrl.toString());

        const response = await fetch(getMessagesUrl.toString());
        if (response.ok) {
          const initialMessages = await response.json();
          console.log('📥 AgentProvider: Retrieved', initialMessages?.length || 0, 'messages');

          if (initialMessages && initialMessages.length > 0) {
            // Convert server messages to our format; IDs will be normalized in reducer
            const convertedMessages = initialMessages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              status: 'complete',
              content: msg.content,
              tools: msg.toolInvocations || [],
              usage: msg.usage
            }));

            console.log('✅ AgentProvider: Restoring', convertedMessages.length, 'messages to chat state');
            // Initialize state with fetched messages
            dispatchChat({ type: 'SET_MESSAGES', messages: convertedMessages });
          }
        } else {
          console.log('❌ AgentProvider: Failed to fetch messages, status:', response.status);
        }
      } catch (error) {
        console.log('🚫 AgentProvider: Error fetching initial messages:', error);
      }
    };

    if (agent._url) {
      fetchInitialMessages();
    }
  }, [agent, sessionId]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = getAgentData();
    if (savedData) {
      setSelectedCharacter(savedData.character);
      setStats(savedData.stats || DEFAULT_STATS);
      setInventory(savedData.inventory || []);
      setLastInteraction(savedData.lastInteraction || Date.now());
      setInsights(savedData.insights || []);
    }
    setIsInitialized(true);
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (isInitialized && selectedCharacter) {
      saveAgentData({
        character: selectedCharacter,
        stats,
        inventory,
        lastInteraction,
        insights,
      });
    }
  }, [selectedCharacter, stats, inventory, lastInteraction, insights, isInitialized]);

  // Periodic sync with server state
  useEffect(() => {
    if (!agent?._url || !isInitialized || !selectedCharacter) return;
    
    const interval = setInterval(async () => {
      const serverCharacter = await fetchServerState();
      if (!serverCharacter) return;
      
      // Server is always the source of truth - sync unconditionally
      console.log('🔄 Syncing from server (server is source of truth)');
      
      // Update character if it changed
      if (serverCharacter.id !== selectedCharacter.id) {
        const newCharacter = CHARACTERS[serverCharacter.id];
        if (newCharacter) {
          setSelectedCharacter({ ...newCharacter, lastSync: serverCharacter.lastSync || Date.now() });
        }
      } else {
        setSelectedCharacter(prev => ({ ...prev, lastSync: serverCharacter.lastSync || Date.now() }));
      }
      
      // Always update stats from server
      setStats(serverCharacter.stats);
      setLastInteraction(serverCharacter.lastSync || Date.now());
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [agent, isInitialized, selectedCharacter, lastInteraction, fetchServerState]);

  // Agent message handling (from AgentChat.jsx)
  useEffect(() => {
    const handleStreamingResponse = (data) => {
      const { id, body, done } = data;

      if (done && body === "") {
        dispatchChat({ type: 'STREAM_COMPLETE', id });
        setIsProcessing(false);
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
            } catch (e) { }
            break;
          }
          case FRAME_TOOL_RESULT: {
            try {
              const toolResult = JSON.parse(content);
              dispatchChat({ type: 'TOOL_RESULT', id, toolResult });
            } catch (e) { }
            break;
          }
          case FRAME_USAGE_E:
          case FRAME_USAGE_D: {
            try {
              const usage = JSON.parse(content);
              dispatchChat({ type: 'USAGE', id, usage });
            } catch (e) { }
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

        // Known WebSocket message types:
        // - "cf_agent_use_chat_response": Streaming chat responses from agent
        // - "cf_agent_mcp_servers": MCP (Model Context Protocol) server status/updates (filtered from chat)
        // - "cf_agent_state": Agent state updates/heartbeat (filtered from chat)
        // - Other types: Connection status, errors, etc. (shown as system messages)
        
        if (data.type === "cf_agent_use_chat_response") {
          handleStreamingResponse(data);
        } else if (data.type !== "cf_agent_mcp_servers" && data.type !== "cf_agent_state") {
          // Filter out internal agent messages from chat display
          dispatchChat({ type: 'ADD_SYSTEM', content: data.type });
        }
      } catch (e) {
        // Handle raw data if needed
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
  }, [agent]);

  // Decay stats over time
  useEffect(() => {
    if (!selectedCharacter) return;

    const decayInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceInteraction = now - lastInteraction;
      const hoursElapsed = timeSinceInteraction / (1000 * 60 * 60);

      if (hoursElapsed > 1) {
        setStats(prev => ({
          happiness: clampStat(prev.happiness - 2),
          energy: clampStat(prev.energy - 3),
          intelligence: clampStat(prev.intelligence - 1),
        }));
      }
    }, 60000); // Check every minute

    return () => clearInterval(decayInterval);
  }, [selectedCharacter, lastInteraction]);

  // Watch for completed messages with TicTacToe tools and update game state
  useEffect(() => {
    const latestMessage = chatState.messages[chatState.messages.length - 1];
    if (latestMessage?.role === 'assistant' && latestMessage?.status === 'complete' && latestMessage?.tools) {
      latestMessage.tools.forEach(tool => {
        if (tool.toolName && tool.result) {
          updateGameStateFromTool(tool.toolName, tool.result);
        }
      });
    }
  }, [chatState.messages]);

  const selectCharacter = useCallback((characterId) => {
    const character = CHARACTERS[characterId];
    if (character) {
      const now = Date.now();
      setSelectedCharacter({ ...character, lastSync: now });
      setStats(DEFAULT_STATS);
      setInventory([]);
      setLastInteraction(now);
    }
  }, []);

  const feedItem = useCallback((itemId) => {
    const item = Object.values(ITEMS).find(i => i.id === itemId);
    if (!item) return;

    // Play coffee animation if coffee is being fed
    if (itemId === 'coffee' && selectedCharacter) {
      setPlayingAnimation('coffee');
      
      // Clear animation after 3 seconds (adjust based on your video length)
      setTimeout(() => {
        setPlayingAnimation(null);
      }, 6000);
    }

    const now = Date.now();

    // Calculate new stats immediately
    const currentStats = stats;
    const newStats = { ...currentStats };
    Object.entries(item.effect).forEach(([stat, value]) => {
      newStats[stat] = clampStat(currentStats[stat] + value);
    });

    // Update local state
    setStats(newStats);

    // Send stats to server immediately (no timeout)
    if (agent?._url) {
      const syncStats = async () => {
        try {
          const url = new URL(agent._url.replace("ws://", "http://").replace("wss://", "https://"));
          url.pathname += '/api/sync-stats';
          
          const response = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              characterId: selectedCharacter.id,
              characterName: selectedCharacter.name,
              stats: newStats
            })
          });
          
          console.log('📤 Stats synced to server:', newStats, 'Response:', response.status);
        } catch (error) {
          console.error('❌ Failed to sync stats to server:', error);
        }
      };
      syncStats();
    }

    // Update lastSync to mark this as a local change
    setSelectedCharacter(prev => prev ? { ...prev, lastSync: now } : prev);
    setLastInteraction(now);

    // Add to inventory history
    setInventory(prev => [...prev, { item: item.id, timestamp: now }]);
  }, [selectedCharacter, agent]);

  const addInsight = useCallback((insight) => {
    setInsights(prev => [
      { id: Date.now(), text: insight, timestamp: Date.now() },
      ...prev.slice(0, 9) // Keep last 10 insights
    ]);
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Chat functions (from AgentChat.jsx)
  const sendChatMessage = useCallback((content) => {
    const messageId = Math.random().toString(36).substring(2, 8);
    const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");

    console.log('💌 AgentProvider: Sending message with ID:', messageId, 'for session:', sessionId);
    setIsProcessing(true);

    // Build conversation history from current messages
    const conversationHistory = chatState.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt || new Date().toISOString()
      }));

    console.log('📜 AgentProvider: Including', conversationHistory.length, 'previous messages in context');

    // Add the new user message
    const newUserMessage = {
      id: Math.random().toString(36).substring(2, 8),
      role: "user",
      content: content,
      createdAt: new Date().toISOString()
    };

    const message = {
      id: messageId,  // Use unique message ID instead of session ID
      type: "cf_agent_use_chat_request",
      url: agentUrl,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...conversationHistory, newUserMessage]
        })
      }
    };

    agent.send(JSON.stringify(message));
    dispatchChat({ type: 'ADD_USER_MESSAGE', id: messageId, content });
  }, [agent, sessionId, chatState.messages]);

  const handleTicTacToeMove = useCallback((row, col) => {
    const moveMessage = `I want to make my TicTacToe move. Please call the makeTicTacToeMove tool with row: ${row} and col: ${col}`;
    sendChatMessage(moveMessage);
  }, [sendChatMessage]);

  const updateGameStateFromTool = useCallback((toolName, toolResult) => {
    if ((toolName === 'startTicTacToe' || toolName === 'makeTicTacToeMove') && toolResult?.board) {
      setCurrentGame({
        board: toolResult.board,
        message: toolResult.message,
        toolName: toolName,
        timestamp: Date.now()
      });
    } else if (toolName === 'clearTicTacToeBoard') {
      setCurrentGame(null);
    }
  }, []);

  const clearMessages = useCallback(() => {
    dispatchChat({ type: 'CLEAR_MESSAGES' });
    setCurrentGame(null);
  }, []);

  // Auto-sync character stats to server
  const syncStatsToServer = useCallback((newStats, character) => {
    if (!character) return;

    const syncMessage = `Please sync my character stats: ${character.name} (${character.id}) with happiness: ${newStats.happiness}, energy: ${newStats.energy}, intelligence: ${newStats.intelligence}`;
    console.log('🔄 Auto-syncing stats to server:', syncMessage);
    sendChatMessage(syncMessage);
  }, [sendChatMessage]);

  // DISABLED: Auto-sync stats to server when they change (chat-based)
  // Use a ref to prevent syncing on initial load and track last sync
  const lastSyncStatsRef = useRef(null);
  const hasSyncedInitialStatsRef = useRef(false);

  // DISABLED: Chat-based auto-sync to reduce chat noise (HTTP sync still works)
  // useEffect(() => {
  //   if (!selectedCharacter || !isInitialized) return;

  //   // Don't sync on initial load
  //   if (!hasSyncedInitialStatsRef.current) {
  //     hasSyncedInitialStatsRef.current = true;
  //     lastSyncStatsRef.current = { ...stats };
  //     return;
  //   }

  //   // Don't sync if stats haven't actually changed
  //   const lastStats = lastSyncStatsRef.current;
  //   if (lastStats &&
  //     lastStats.happiness === stats.happiness &&
  //     lastStats.energy === stats.energy &&
  //     lastStats.intelligence === stats.intelligence) {
  //     return;
  //   }

  //   const timeoutId = setTimeout(() => {
  //     syncStatsToServer(stats, selectedCharacter);
  //     lastSyncStatsRef.current = { ...stats };
  //   }, 2000); // 2 second debounce

  //   return () => clearTimeout(timeoutId);
  // }, [stats, selectedCharacter, isInitialized, syncStatsToServer]);

  const mood = selectedCharacter ? getMood(stats) : 'neutral';

  const value = {
    // State
    selectedCharacter,
    stats,
    inventory,
    insights,
    mood,
    isVisible,
    isInitialized,
    playingAnimation,

    // Chat state
    chatMessages: chatState.messages,
    isProcessing,
    currentGame,

    // Actions
    selectCharacter,
    feedItem,
    addInsight,
    toggleVisibility,

    // Chat actions
    sendChatMessage,
    handleTicTacToeMove,
    clearMessages,

    // Agent connection
    agent,
    sessionId,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentCompanion() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentCompanion must be used within AgentProvider');
  }
  return context;
}