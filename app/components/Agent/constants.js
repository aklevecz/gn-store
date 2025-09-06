export const AGENT_HOST = "localhost:5173";
export const AGENT_NAME = "chat";

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
  MUSIC_TREAT: { id: 'music', name: 'Music', effect: { happiness: 30 }, type: 'music' },
};

export const DEFAULT_STATS = {
  happiness: 75,
  energy: 75,
  intelligence: 50,
};

export const MAX_STAT = 100;
export const MIN_STAT = 0;

export function clampStat(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

export function getMood(stats) {
  const avgMood = (stats.happiness + stats.energy) / 2;
  if (avgMood >= 80) return 'excited';
  if (avgMood >= 60) return 'happy';
  if (avgMood >= 40) return 'neutral';
  return 'sad';
}


