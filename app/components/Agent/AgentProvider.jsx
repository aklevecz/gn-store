import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAgentData, saveAgentData } from '~/lib/agent-storage';

const AgentContext = createContext(null);

export const CHARACTERS = {
  GROOVY: {
    id: 'groovy',
    name: 'Groovy',
    description: 'The music enthusiast - vinyl expert and music historian',
    defaultImage: '/characters/groovy-stand.png',
    moods: {
      happy: '/characters/groovy-thumbsup.png',
      neutral: '/characters/groovy-stand.png',
      sad: '/characters/groovy-stand.png',
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
      sad: '/characters/globby-thumbsup.png',
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
    
    // Actions
    selectCharacter,
    feedItem,
    addInsight,
    toggleVisibility,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}