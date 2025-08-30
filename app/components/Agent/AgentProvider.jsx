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
  // Music items
  VINYL_RECORD: { id: 'vinyl', name: 'Vinyl Record', effect: { happiness: 15 }, type: 'music' },
  CONCERT_TICKET: { id: 'ticket', name: 'Concert Ticket', effect: { happiness: 25 }, type: 'music' },
  MUSIC_NOTE: { id: 'note', name: 'Music Note', effect: { happiness: 5 }, type: 'music' },
  
  // Eco items
  SOLAR_POWER: { id: 'solar', name: 'Solar Power', effect: { energy: 20 }, type: 'eco' },
  RECYCLED_MATERIALS: { id: 'recycled', name: 'Recycled Materials', effect: { intelligence: 10 }, type: 'eco' },
  ORGANIC_SNACK: { id: 'organic', name: 'Organic Snack', effect: { energy: 10, happiness: 5 }, type: 'eco' },
  PLANT_SEEDS: { id: 'seeds', name: 'Plant Seeds', effect: { happiness: 10, intelligence: 5 }, type: 'eco' },
  WATER_BOTTLE: { id: 'water', name: 'Reusable Water Bottle', effect: { energy: 15 }, type: 'eco' },
  COMPOST: { id: 'compost', name: 'Compost', effect: { intelligence: 15 }, type: 'eco' },
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

// Chat reducer from AgentChat.jsx
const initialChatState = {
  messages: [],
  streams: new Map(),
  seq: 0,
};

function chatReducer(state, action) {
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
  
  // Chat state management with reducer (from AgentChat.jsx)
  const [chatState, dispatchChat] = useReducer(chatReducer, initialChatState);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 8));
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  // Initialize agent connection
  const agent = useAgent({
    agent: AGENT_NAME,
    host: HOST
  });

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
        } else {
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
      setSelectedCharacter(character);
      setStats(DEFAULT_STATS);
      setInventory([]);
      setLastInteraction(Date.now());
    }
  }, []);

  const feedItem = useCallback((itemId) => {
    const item = Object.values(ITEMS).find(i => i.id === itemId);
    if (!item) return;

    setStats(prev => {
      const newStats = { ...prev };
      Object.entries(item.effect).forEach(([stat, value]) => {
        newStats[stat] = clampStat(prev[stat] + value);
      });
      return newStats;
    });

    setLastInteraction(Date.now());
    
    // Add to inventory history
    setInventory(prev => [...prev, { item: item.id, timestamp: Date.now() }]);
  }, []);

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
    const id = sessionId;
    const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
    
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
    
    // Add the new user message
    const newUserMessage = {
      id: Math.random().toString(36).substring(2, 8),
      role: "user",
      content: content,
      createdAt: new Date().toISOString()
    };
    
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
          messages: [...conversationHistory, newUserMessage]
        })
      }
    };
    
    agent.send(JSON.stringify(message));
    dispatchChat({ type: 'ADD_USER_MESSAGE', id, content });
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

  // Auto-sync stats to server when they change (debounced)
  // Use a ref to prevent syncing on initial load and track last sync
  const lastSyncStatsRef = useRef(null);
  const hasSyncedInitialStatsRef = useRef(false);
  
  useEffect(() => {
    if (!selectedCharacter || !isInitialized) return;
    
    // Don't sync on initial load
    if (!hasSyncedInitialStatsRef.current) {
      hasSyncedInitialStatsRef.current = true;
      lastSyncStatsRef.current = { ...stats };
      return;
    }
    
    // Don't sync if stats haven't actually changed
    const lastStats = lastSyncStatsRef.current;
    if (lastStats && 
        lastStats.happiness === stats.happiness && 
        lastStats.energy === stats.energy && 
        lastStats.intelligence === stats.intelligence) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      syncStatsToServer(stats, selectedCharacter);
      lastSyncStatsRef.current = { ...stats };
    }, 2000); // 2 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [stats, selectedCharacter, isInitialized, syncStatsToServer]);

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