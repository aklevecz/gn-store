import { createContext, useContext, useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { getAgentData, saveAgentData } from '~/lib/agent-storage';
import { useAgent } from 'agents/react';
import { AGENT_HOST, AGENT_NAME, CHARACTERS, DEFAULT_STATS } from './constants';
import { chatReducer, initialChatState } from './chatReducer';
import { useAgentStreaming } from './useAgentStreaming';
import { useAgentServerSync } from './useAgentServerSync';
import { useCharacterState } from './useCharacterState';
import { ErrorToastContainer } from './ErrorToast';
import ErrorBoundary from './ErrorBoundary';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [errors, setErrors] = useState([]);
  const [lastMessageTime, setLastMessageTime] = useState(0);

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

  // Error handling utilities
  const handleError = useCallback((error, context) => {
    console.error(`[${context}]`, error);

    const errorObj = {
      id: Date.now().toString(),
      title: context,
      message: getFriendlyErrorMessage(error),
      timestamp: Date.now(),
      originalError: error
    };

    setErrors(prev => [...prev, errorObj]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== errorObj.id));
    }, 5000);
  }, []);

  const getFriendlyErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';

    if (error.message?.includes('Failed to fetch')) {
      return 'Unable to connect to server. Please check your connection.';
    }

    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (error.message?.includes('Network')) {
      return 'Network error. Please check your internet connection.';
    }

    if (error.message?.includes('WebSocket')) {
      return 'Connection lost. Attempting to reconnect...';
    }

    return error.message || 'Something went wrong. Please try again.';
  };

  const dismissError = useCallback((errorId) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const retryWithBackoff = useCallback(async (fn, maxRetries = 3, context = 'Operation') => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === maxRetries - 1) {
          handleError(err, context);
          throw err;
        }

        const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`[${context}] Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [handleError]);

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
    handleError,
    retryWithBackoff,
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

  // Error handling utilities (defined above)

  // Periodic sync handled in useAgentServerSync

  useAgentStreaming(agent, dispatchChat, () => setIsProcessing(false), handleError);

  // Character decay handled in useCharacterState

  // Watch for completed messages with TicTacToe tools and update game state
  useEffect(() => {
    const latestMessage = chatState.messages[chatState.messages.length - 1];
    // Check for both 'complete' and 'pending' status (pending = streaming just finished, waiting for server ID)
    const isReady = latestMessage?.role === 'assistant' &&
                    (latestMessage?.status === 'complete' || latestMessage?.status === 'pending');

    if (isReady && latestMessage?.tools) {
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
  const sendChatMessage = useCallback((content, options = {}) => {
    // Rate limiting: minimum 1 second between messages
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < 1000 && !options.bypassRateLimit) {
      const error = new Error('Please wait a moment before sending another message');
      handleError(error, 'Rate Limit');
      return;
    }

    setLastMessageTime(now);

    const messageId = Math.random().toString(36).substring(2, 8);
    const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");

    console.log('💌 AgentProvider: Sending message with ID:', messageId);
    setIsProcessing(true);

    // Detect if this is a tool call (TicTacToe, character sync, etc.)
    const isToolCall = options.isToolCall || 
    // these should come from an array instead of being harcoded
      content.includes('makeTicTacToeMove') || 
      content.includes('startTicTacToe') || 
      content.includes('clearTicTacToeBoard') ||
      content.includes('showTicTacToeBoard') ||
      content.includes('sync my character stats');

    // Build conversation history - truncate for tool calls
    let conversationHistory;
    if (isToolCall) {
      // For tool calls, only send the last few messages for context
      conversationHistory = chatState.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-3) // Only last 3 messages
        .map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt || new Date().toISOString()
        }));
      console.log('🎯 AgentProvider: Tool call detected - using minimal context:', conversationHistory.length, 'messages');
    } else {
      // For regular chat, send more context but still limit
      conversationHistory = chatState.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10) // Only last 10 messages for regular chat
        .map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt || new Date().toISOString()
        }));
      console.log('📜 AgentProvider: Regular chat - including', conversationHistory.length, 'messages in context');
    }

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

    try {
      agent.send(JSON.stringify(message));
      dispatchChat({ type: 'ADD_USER_MESSAGE', id: messageId, content });
    } catch (error) {
      console.error('[sendChatMessage] Failed to send message:', error);
      handleError(error, 'Send Message');
      setIsProcessing(false);
    }
  }, [agent, chatState.messages, lastMessageTime, handleError]);

  const handleTicTacToeMove = useCallback((row, col) => {
    const moveMessage = `I want to make my TicTacToe move. Please call the makeTicTacToeMove tool with row: ${row} and col: ${col}`;
    sendChatMessage(moveMessage, { isToolCall: true });
  }, [sendChatMessage]);

  const updateGameStateFromTool = useCallback((toolName, toolResult) => {
    // Handle new TicTacToeResponse structure
    if (toolName === 'startTicTacToe' || toolName === 'makeTicTacToeMove' || toolName === 'showTicTacToeBoard') {
      if (toolResult?.success && toolResult?.board) {
        setCurrentGame({
          board: toolResult.board,           // Raw 3x3 array
          message: toolResult.message,
          currentPlayer: toolResult.currentPlayer,
          winner: toolResult.winner,
          gameActive: toolResult.gameActive,
          lastMove: toolResult.move,         // Last move coordinates
          action: toolResult.action,         // What action was performed
          toolName: toolName,
          timestamp: Date.now()
        });
      } else if (toolResult?.success === false) {
        // Handle error cases - clear game if no active game
        if (toolResult.error === 'NO_ACTIVE_GAME') {
          setCurrentGame(null);
        }
        // For other errors (NOT_YOUR_TURN, CELL_OCCUPIED), keep current game state
        console.warn('TicTacToe tool error:', toolResult.error, toolResult.message);
      }
    } else if (toolName === 'clearTicTacToeBoard') {
      if (toolResult?.success) {
        setCurrentGame(null);
      }
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

    // Error handling
    handleError,
    retryWithBackoff,
  };

  return (
    <ErrorBoundary onError={(error, errorInfo) => handleError(error, 'React Error Boundary')}>
      <AgentContext.Provider value={value}>
        {children}
        <ErrorToastContainer errors={errors} onDismiss={dismissError} />
      </AgentContext.Provider>
    </ErrorBoundary>
  );
}

export function useAgentCompanion() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentCompanion must be used within AgentProvider');
  }
  return context;
}