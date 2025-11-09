import { useCallback, useEffect } from 'react';
import { CHARACTERS } from './constants';

export function useAgentServerSync({ agent, isInitialized, selectedCharacter, setSelectedCharacter, setStats, setLastInteraction, dispatchChat, handleError, retryWithBackoff }) {
  const fetchServerState = useCallback(async () => {
    if (!agent?._url) return null;
    try {
      const url = new URL(agent._url.replace("ws://", "http://").replace("wss://", "https://"));
      url.pathname += '/api/debug/state';
      const response = await fetch(url.toString());
      if (!response.ok) {
        const error = new Error(`Server returned ${response.status}: ${response.statusText}`);
        if (handleError) handleError(error, 'Server State Fetch');
        return null;
      }
      const serverState = await response.json();
      return serverState.character;
    } catch (error) {
      console.error('[useAgentServerSync] Failed to fetch server state:', error);
      if (handleError) handleError(error, 'Server State Fetch');
      return null;
    }
  }, [agent, handleError]);

  // Log agent URL
  useEffect(() => {
    if (agent?._url) {
      // eslint-disable-next-line no-console
      console.log('🔗 AgentProvider: Agent URL:', agent._url);
    }
  }, [agent?._url]);

  // Initial server sync when connected
  useEffect(() => {
    const run = async () => {
      if (!agent?._url || !selectedCharacter) return;
      const serverCharacter = await fetchServerState();
      if (!serverCharacter) return;
      const serverLastSync = serverCharacter.lastSync || 0;
      const localLastSync = selectedCharacter.lastSync || 0;
      if (serverLastSync > localLastSync) {
        if (serverCharacter.id !== selectedCharacter.id) {
          const newCharacter = CHARACTERS[serverCharacter.id];
          if (newCharacter) {
            setSelectedCharacter({ ...newCharacter, lastSync: serverLastSync });
          }
        } else {
          setSelectedCharacter(prev => ({ ...prev, lastSync: serverLastSync }));
        }
        setStats(serverCharacter.stats);
        setLastInteraction(serverLastSync);
      }
    };
    if (agent?._url && selectedCharacter && isInitialized) run();
  }, [agent?._url, selectedCharacter, isInitialized, fetchServerState, setSelectedCharacter, setStats, setLastInteraction]);

  // Periodic server sync - DISABLED (causes excessive polling)
  // useEffect(() => {
  //   if (!agent?._url || !isInitialized || !selectedCharacter) return;
  //   const interval = setInterval(async () => {
  //     const serverCharacter = await fetchServerState();
  //     if (!serverCharacter) return;
  //     if (serverCharacter.id !== selectedCharacter.id) {
  //       const newCharacter = CHARACTERS[serverCharacter.id];
  //       if (newCharacter) {
  //         setSelectedCharacter({ ...newCharacter, lastSync: serverCharacter.lastSync || Date.now() });
  //       }
  //     } else {
  //       setSelectedCharacter(prev => ({ ...prev, lastSync: serverCharacter.lastSync || Date.now() }));
  //     }
  //     setStats(serverCharacter.stats);
  //     setLastInteraction(serverCharacter.lastSync || Date.now());
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, [agent?._url, isInitialized, selectedCharacter, fetchServerState, setSelectedCharacter, setStats, setLastInteraction]);

  // Initial message fetch with retry
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
        const getMessagesUrl = new URL(agentUrl);
        getMessagesUrl.pathname += "/get-messages";

        const fetchMessages = async () => {
          const response = await fetch(getMessagesUrl.toString());
          if (!response.ok) {
            throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
          }
          return response.json();
        };

        // Use retry with backoff if available
        const initialMessages = retryWithBackoff
          ? await retryWithBackoff(fetchMessages, 3, 'Initial Message Load')
          : await fetchMessages();

        if (initialMessages && initialMessages.length > 0) {
          // Server messages have permanent IDs - use them directly
          const serverMessages = initialMessages.map((msg) => ({
            id: msg.id,          // Server's permanent UUID
            role: msg.role,
            status: 'complete',  // Server messages are always complete
            content: msg.content,
            tools: msg.toolInvocations || [],
            usage: msg.usage,
            createdAt: msg.createdAt,
            tempId: undefined    // No temp IDs for server messages
          }));

          dispatchChat({ type: 'SET_MESSAGES', messages: serverMessages });

          console.log('📥 Loaded messages from server:', {
            count: serverMessages.length,
            sampleIds: serverMessages.map(m => m.id).slice(0, 3)
          });
        }
      } catch (error) {
        console.error('[useAgentServerSync] Failed to fetch initial messages:', error);
        if (handleError) handleError(error, 'Initial Message Load');
      }
    };
    if (agent?._url) fetchInitialMessages();
  }, [agent?._url, dispatchChat, handleError, retryWithBackoff]);

  return { fetchServerState };
}


