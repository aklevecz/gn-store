import { useCallback, useEffect, useState, useRef } from 'react';
import { DEFAULT_STATS, ITEMS, clampStat, getMood } from './constants';

export function useCharacterState({ agent }) {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [inventory, setInventory] = useState([]);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [insights, setInsights] = useState([]);
  const [playingAnimation, setPlayingAnimation] = useState(null);

  const mood = selectedCharacter ? getMood(stats) : 'neutral';

  const selectCharacter = useCallback((character) => {
    if (!character) return;
    const now = Date.now();
    setSelectedCharacter({ ...character, lastSync: now });
    setStats(DEFAULT_STATS);
    setInventory([]);
    setLastInteraction(now);
  }, []);

  const feedItem = useCallback(async (itemId) => {
    console.log('feedItem called with itemId:', itemId);
    const item = Object.values(ITEMS).find(i => i.id === itemId);
    console.log('Found item:', item);
    if (!item || !selectedCharacter) return;

    // Map item IDs to animation names
    const animationMap = {
      'coffee': 'coffee',
      'music': 'music'
    };

    const animationName = animationMap[itemId];
    console.log('Animation name for', itemId, ':', animationName);
    if (animationName) {
      console.log('Setting animation to:', animationName);
      setPlayingAnimation(animationName);
      setTimeout(() => setPlayingAnimation(null), 6000);
    }

    const now = Date.now();

    const currentStats = stats;
    const newStats = { ...currentStats };
    Object.entries(item.effect).forEach(([stat, value]) => {
      newStats[stat] = clampStat(currentStats[stat] + value);
    });
    setStats(newStats);

    if (agent?._url) {
      try {
        const url = new URL(agent._url.replace("ws://", "http://").replace("wss://", "https://"));
        url.pathname += '/api/sync-stats';
        await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: selectedCharacter.id,
            characterName: selectedCharacter.name,
            stats: newStats
          })
        });
      } catch (error) {
      }
    }

    setSelectedCharacter(prev => prev ? { ...prev, lastSync: now } : prev);
    setLastInteraction(now);
    setInventory(prev => [...prev, { item: item.id, timestamp: now }]);
  }, [stats, selectedCharacter, agent]);

  const addInsight = useCallback((insight) => {
    setInsights(prev => [
      { id: Date.now(), text: insight, timestamp: Date.now() },
      ...prev.slice(0, 9)
    ]);
  }, []);

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
    }, 60000);
    return () => clearInterval(decayInterval);
  }, [selectedCharacter, lastInteraction]);

  // Optional chat-based sync (kept disabled, wiring left here)
  const lastSyncStatsRef = useRef(null);
  const hasSyncedInitialStatsRef = useRef(false);

  return {
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
  };
}


