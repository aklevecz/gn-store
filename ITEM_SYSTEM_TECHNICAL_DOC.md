# Agent Item System - Technical Flow Documentation

## Overview
The item system allows users to feed various items to their virtual companion characters (Groovy and Globby) to boost their stats. Each item provides specific stat modifications and the system tracks feeding history and manages stat boundaries.

---

## Item Data Structure

### Item Definition
Items are defined in `AgentProvider.jsx` as a constant object:

```javascript
const ITEMS = {
  // Music items
  VINYL_RECORD: { 
    id: 'vinyl', 
    name: 'Vinyl Record', 
    effect: { happiness: 15 }, 
    type: 'music' 
  },
  CONCERT_TICKET: { 
    id: 'ticket', 
    name: 'Concert Ticket', 
    effect: { happiness: 25 }, 
    type: 'music' 
  },
  MUSIC_NOTE: { 
    id: 'note', 
    name: 'Music Note', 
    effect: { happiness: 5 }, 
    type: 'music' 
  },
  
  // Eco items
  SOLAR_POWER: { 
    id: 'solar', 
    name: 'Solar Power', 
    effect: { energy: 20 }, 
    type: 'eco' 
  },
  RECYCLED_MATERIALS: { 
    id: 'recycled', 
    name: 'Recycled Materials', 
    effect: { intelligence: 10 }, 
    type: 'eco' 
  },
  ORGANIC_SNACK: { 
    id: 'organic', 
    name: 'Organic Snack', 
    effect: { energy: 10, happiness: 5 }, 
    type: 'eco' 
  },
  PLANT_SEEDS: { 
    id: 'seeds', 
    name: 'Plant Seeds', 
    effect: { happiness: 10, intelligence: 5 }, 
    type: 'eco' 
  },
  WATER_BOTTLE: { 
    id: 'water', 
    name: 'Reusable Water Bottle', 
    effect: { energy: 15 }, 
    type: 'eco' 
  },
  COMPOST: { 
    id: 'compost', 
    name: 'Compost', 
    effect: { intelligence: 15 }, 
    type: 'eco' 
  }
}
```

### Item Properties
- **id**: Unique identifier for the item
- **name**: Display name shown in UI
- **effect**: Object containing stat modifications (happiness, energy, intelligence)
- **type**: Category ('music' or 'eco') for filtering

---

## Complete Item Feeding Flow

### 1. User Interaction Phase

**Location**: `AgentInventory.jsx`

```
User clicks item button in inventory
↓
handleFeedItem(itemId) triggered
↓
Sets feedingItem state (for animation)
↓
Calls feedItem(itemId) from context
```

### 2. State Update Phase

**Location**: `AgentProvider.jsx` - `feedItem` function (lines 613-634)

```javascript
const feedItem = useCallback((itemId) => {
  // 1. Find item definition
  const item = Object.values(ITEMS).find(i => i.id === itemId);
  if (!item) return;

  const now = Date.now();

  // 2. Apply stat effects with clamping
  setStats(prev => {
    const newStats = { ...prev };
    Object.entries(item.effect).forEach(([stat, value]) => {
      newStats[stat] = clampStat(prev[stat] + value);
    });
    return newStats;
  });

  // 3. Update character's lastSync timestamp
  setSelectedCharacter(prev => prev ? { ...prev, lastSync: now } : prev);
  setLastInteraction(now);

  // 4. Add to inventory history
  setInventory(prev => [...prev, { item: item.id, timestamp: now }]);
}, []);
```

### 3. Stat Calculation Phase

**Stat Clamping Function** (lines 263-265):
```javascript
function clampStat(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}
```

- **MIN_STAT**: 0
- **MAX_STAT**: 100
- Ensures stats stay within valid bounds

### 4. Mood Recalculation Phase

**Location**: `AgentProvider.jsx` - `getMood` function (lines 267-274)

```javascript
function getMood(stats) {
  const avgMood = (stats.happiness + stats.energy) / 2;
  if (avgMood >= 80) return 'excited';
  if (avgMood >= 60) return 'happy';
  if (avgMood >= 40) return 'neutral';
  return 'sad';
}
```

Mood automatically updates when stats change, affecting:
- Character image displayed
- Character animations
- UI mood indicators

### 5. UI Animation Phase

**Location**: `AgentInventory.jsx` (lines 9-17)

```javascript
const handleFeedItem = (itemId) => {
  setFeedingItem(itemId);  // Triggers CSS animation class
  feedItem(itemId);         // Updates stats
  
  setTimeout(() => {
    setFeedingItem(null);   // Remove animation after 1 second
  }, 1000);
};
```

**CSS Classes Applied**:
- `.inventory-item.feeding`: Applied during feeding animation
- Shows visual feedback of item being consumed

### 6. Persistence Phase

**Local Storage** (via useEffect at lines 438-449):
```javascript
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
```

**Saved Data Structure**:
```javascript
{
  character: { id, name, lastSync },
  stats: { happiness, energy, intelligence },
  inventory: [
    { item: 'vinyl', timestamp: 1699123456789 },
    { item: 'solar', timestamp: 1699123456790 }
  ],
  lastInteraction: 1699123456789,
  insights: []
}
```

### 7. Server Synchronization Phase

**Periodic Sync** (lines 451-482):
- Runs every 10 seconds
- Fetches server state from `/api/debug/state`
- Compares timestamps
- Updates local state if server is newer

**Sync Decision Logic**:
```javascript
const serverLastSync = serverCharacter.lastSync || 0;
const localLastSync = selectedCharacter.lastSync || lastInteraction || 0;

if (serverLastSync > localLastSync) {
  // Update from server
}
```

---

## UI Component Structure

### AgentInventory Component Flow

```
AgentInventory
├── Tab Filtering (All/Music/Eco)
│   └── filterItems() - Filters by type
│
├── Item Grid Rendering
│   ├── Icon Display (getItemIcon)
│   ├── Name Display
│   └── Effect Display
│
└── Interaction Handling
    ├── Click Handler
    ├── Disabled State (during animation)
    └── Visual Feedback
```

### Visual Elements

**Icon Mapping**:
```javascript
const icons = {
  vinyl: '💿',
  ticket: '🎫',
  note: '🎵',
  solar: '☀️',
  recycled: '♻️',
  organic: '🥗',
  seeds: '🌱',
  water: '💧',
  compost: '🪴'
};
```

**Effect Indicators**:
- 😊 = Happiness boost
- ⚡ = Energy boost
- 🧠 = Intelligence boost

---

## State Management Details

### Stats Object Structure
```javascript
stats = {
  happiness: 75,    // 0-100
  energy: 75,       // 0-100
  intelligence: 50  // 0-100
}
```

### Inventory History Structure
```javascript
inventory = [
  { item: 'vinyl', timestamp: 1699123456789 },
  { item: 'organic', timestamp: 1699123456790 },
  { item: 'solar', timestamp: 1699123456791 }
]
```

### Character Preferences

**Groovy (Music Character)**:
- Prefers music items
- Message: "🎵 Groovy loves music items but eco items work too!"

**Globby (Eco Character)**:
- Prefers eco items
- Message: "🌍 Globby prefers eco items but enjoys music too!"

*Note: Preferences are currently cosmetic and don't affect stat calculations*

---

## Edge Cases and Validations

### 1. Invalid Item ID
```javascript
const item = Object.values(ITEMS).find(i => i.id === itemId);
if (!item) return; // Exit if item doesn't exist
```

### 2. Stat Overflow Prevention
```javascript
newStats[stat] = clampStat(prev[stat] + value);
// Ensures result stays within 0-100 range
```

### 3. Rapid Clicking Prevention
```javascript
disabled={feedingItem !== null}
// Disables all item buttons during feeding animation
```

### 4. Missing Character Handling
```javascript
setSelectedCharacter(prev => prev ? { ...prev, lastSync: now } : prev);
// Only updates if character exists
```

---

## Performance Considerations

### 1. Animation Throttling
- 1-second cooldown between item feeds
- Prevents animation overlap
- Ensures smooth visual feedback

### 2. State Batching
- Single state update for all stat changes
- React batches multiple setState calls
- Reduces re-renders

### 3. Inventory History Limit
- No built-in limit (potential memory issue)
- Consider implementing max history size
- Could trim old entries after threshold

---

## Debug Interface Integration

The debug interface (`/debug/agent`) provides tools for testing:

### Manual Feed Testing
```javascript
const testFeedItem = (itemId) => {
  feedItem(itemId);
  // Optionally trigger HTTP sync
  if (syncMethod === 'http') {
    setTimeout(() => testHttpSync(), 500);
  }
};
```

### Stat Manipulation
- Sliders for manual stat adjustment
- Direct HTTP sync testing
- Real-time state comparison (local vs server)

---

## Future Enhancement Opportunities

### 1. Item Effects Enhancement
- Time-based effects (temporary boosts)
- Combo effects (feeding multiple items)
- Character-specific bonuses

### 2. Inventory Management
- Item quantities/limits
- Item crafting/combining
- Shop/economy system

### 3. Visual Improvements
- Particle effects on feeding
- Character reactions to specific items
- Sound effects

### 4. Gameplay Mechanics
- Cooldowns per item type
- Daily feeding limits
- Achievement unlocks

### 5. Analytics
- Track most-used items
- Character preference learning
- Usage patterns over time