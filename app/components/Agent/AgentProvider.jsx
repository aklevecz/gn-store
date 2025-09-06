import { createContext, useContext, useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { getAgentData, saveAgentData } from '~/lib/agent-storage';
import { useAgent } from 'agents/react';
import { AGENT_HOST, AGENT_NAME, CHARACTERS, DEFAULT_STATS } from './constants';
import { chatReducer, initialChatState } from './chatReducer';
import { useAgentStreaming } from './useAgentStreaming';
import { useAgentServerSync } from './useAgentServerSync';
import { useCharacterState } from './useCharacterState';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);

  // moved below agent creation

  // Chat state management with reducer
  const [chatState, dispatchChat] = useReducer(chatReducer, initialChatState);
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
    host: AGENT_HOST,
    name: instanceName  // This creates separate DO instances per user
  });

  const {
    selectedCharacter,
    setSelectedCharacter,
    stats,
    setStats,
    inventory,
    setInventory,
    lastInteraction,
    setLastInteraction,
    insights,
    setInsights,
    playingAnimation,
    setPlayingAnimation,
    mood,
    selectCharacter,
    feedItem,
    addInsight,
  } = useCharacterState({ agent });

  // Server sync (initial fetch, periodic sync, initial messages)
  const { fetchServerState } = useAgentServerSync({
    agent,
    isInitialized,
    selectedCharacter,
    setSelectedCharacter,
    setStats,
    setLastInteraction,
    dispatchChat,
  });

  // Debug logging now handled in useAgentServerSync

  // Initial server state fetch is handled in useAgentServerSync

  // Initial messages handled in useAgentServerSync

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

  // Periodic sync handled in useAgentServerSync

  useAgentStreaming(agent, dispatchChat, () => setIsProcessing(false));

  // Character decay handled in useCharacterState

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

  const selectCharacterById = useCallback((characterId) => {
    const character = CHARACTERS[characterId];
    if (character) {
      // Delegate to hook's selector, which handles resets/sync
      selectCharacter(character);
    }
  }, [selectCharacter]);

  // feedItem provided by useCharacterState

  // addInsight provided by useCharacterState

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Chat functions (from AgentChat.jsx)
  const sendChatMessage = useCallback((content) => {
    const messageId = Math.random().toString(36).substring(2, 8);
    const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");

    console.log('💌 AgentProvider: Sending message with ID:', messageId);
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
  }, [agent, chatState.messages]);

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

  // mood provided by useCharacterState

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
    selectCharacter: selectCharacterById,
    feedItem,
    addInsight,
    toggleVisibility,

    // Chat actions
    sendChatMessage,
    handleTicTacToeMove,
    clearMessages,

    // Agent connection
    agent,
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