# Agent Implementation - Quick Reference Guide

## File Locations

| Purpose | File | Lines |
|---------|------|-------|
| Main Agent Widget | `app/components/Agent/Agent.jsx` | 142 |
| State Management (Context) | `app/components/Agent/AgentProvider.jsx` | 343 |
| Character State Hook | `app/components/Agent/useCharacterState.js` | 120+ |
| Server Sync Hook | `app/components/Agent/useAgentServerSync.js` | 100+ |
| WebSocket Streaming | `app/components/Agent/useAgentStreaming.js` | 90+ |
| Chat Reducer | `app/components/Agent/chatReducer.js` | 187 |
| Configuration | `app/components/Agent/constants.js` | 60 |
| Stats Display | `app/components/Agent/AgentStatus.jsx` | 112 |
| Chat Interface | `app/components/Agent/AgentChatTab.jsx` | 94 |
| Item Feeding | `app/components/Agent/AgentInventory.jsx` | 108 |
| Character Selection | `app/components/Agent/AgentSelector.jsx` | 41 |
| TicTacToe Game | `app/components/Agent/AgentTicTacToeTab.jsx` | 80+ |
| Storage Layer | `app/lib/agent-storage.js` | 33 |
| API Client | `app/lib/agent-mcp.js` | 105 |
| API Endpoint | `app/routes/api.agent.jsx` | 105 |
| Debug Interface | `app/routes/debug.agent.jsx` | 446 |
| Styling | `app/styles/agent.css` | - |
| Integration | `app/components/PageLayout.jsx` | 300 |

## Key Hooks & Exports

```javascript
// Main hook for accessing agent state
import { useAgentCompanion } from '~/components/Agent/AgentProvider';

const {
  selectedCharacter,    // Current character object
  stats,               // { happiness, energy, intelligence }
  inventory,           // Array of fed items
  insights,            // Array of insights
  mood,                // Derived mood string
  isVisible,           // UI visibility
  isInitialized,       // Ready to render
  playingAnimation,    // Current animation
  chatMessages,        // Array of messages
  isProcessing,        // Chat processing state
  currentGame,         // TicTacToe game state
  selectCharacter,     // Function to change character
  feedItem,            // Function to feed item
  addInsight,          // Function to add insight
  toggleVisibility,    // Function to toggle widget
  sendChatMessage,     // Function to send chat
  handleTicTacToeMove, // Function for game move
  clearMessages,       // Function to clear chat
  agent                // WebSocket connection
} = useAgentCompanion();
```

## Configuration

```javascript
// app/components/Agent/constants.js

// Server connection
AGENT_HOST = "localhost:5174"      // Dev server
AGENT_NAME = "chat"                // Agent identifier
ENV_PROTOCOL = "http" | "https"    // Based on NODE_ENV

// Characters
CHARACTERS.GROOVY    // Music enthusiast
CHARACTERS.GLOBBY    // Eco-warrior

// Items
ITEMS.COFFEE         // +20 energy, +10 happiness, +5 intelligence
ITEMS.MUSIC_TREAT    // +30 happiness

// Defaults
DEFAULT_STATS = {
  happiness: 75,
  energy: 75,
  intelligence: 50
}

// Mood calculation
getMood(stats)       // Returns: sad | neutral | happy | excited
```

## API Endpoints

### POST `/api/agent`
```javascript
// Actions
{
  action: 'getInsight',
  context: { page, product, character }
}

{
  action: 'feedItem',
  item: 'coffee' | 'music'
}

{
  action: 'updateStats',
  stats: { happiness, energy, intelligence }
}

{
  action: 'getRecommendation',
  context: { character, stats, browsing }
}
```

### GET `/debug/agent` (Dev-only)
Comprehensive debug interface with:
- Connection status
- Character state inspector
- Manual stats control
- Sync testing (HTTP vs Tool)
- Feed items testing
- Tool testing
- Message history export

### Server Endpoints (Durable Objects)

```
GET  /api/debug/state              # Get current character state
GET  /get-messages                 # Fetch message history
POST /api/sync-stats               # Sync character stats
```

## Message Structure

```javascript
{
  id: string,                    // UUID from server
  role: 'user' | 'assistant',    // Message source
  content: string,               // Message text
  status: 'complete' | 'streaming',
  tools: [                       // Tool invocations
    {
      toolCallId: string,
      toolName: string,          // TicTacToe, etc
      result: any
    }
  ],
  usage: {                       // Token usage (optional)
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  }
}
```

## Streaming Frame Prefixes

```
0:  Text content        → JSON.parse(content) for text
9:  Tool start          → JSON.parse(content) for tool call
a:  Tool result         → JSON.parse(content) for result
e:  Usage (encoded)     → JSON.parse(content) for usage
d:  Usage (decoded)     → JSON.parse(content) for usage
f:  Metadata            → Skip/ignore
```

## LocalStorage

```javascript
// Storage key: 'goodneighbor_agent'
{
  character,           // Current character object
  stats,              // Character stats
  inventory,          // Array of fed items
  lastInteraction,    // Timestamp
  insights            // Array of insights
}

// Session key: 'gn-friend-user-session'
// Value: user-XXXXXX (random 6 chars)
```

## State Flow

### Component Hierarchy
```
PageLayout
└── AgentProvider (Context)
    ├── useCharacterState      (Character + stats)
    ├── useAgentServerSync     (Sync with server)
    ├── useAgentStreaming      (WebSocket)
    ├── useReducer(chatReducer) (Chat messages)
    └── Agent (UI)
        ├── AgentSelector      (Pick character)
        ├── AgentStatus        (Show stats)
        ├── AgentChatTab       (Chat UI)
        ├── AgentInventory     (Feed items)
        └── AgentTicTacToeTab  (Play game)
```

### Sync Flow

```
On Mount
└─→ Fetch initial messages from /get-messages
    └─→ Fetch server state from /api/debug/state

Every 10 seconds
└─→ Check server state
    └─→ Update if changed

On Feed Item
└─→ Update local stats immediately
    └─→ POST to /api/sync-stats
        └─→ Server persists

On Chat Message
└─→ Send via WebSocket
    └─→ Server processes
        └─→ Stream response back
```

## Common Tasks

### Access Agent State
```javascript
import { useAgentCompanion } from '~/components/Agent/AgentProvider';

function MyComponent() {
  const { selectedCharacter, stats, mood } = useAgentCompanion();
  return <div>{selectedCharacter.name} is {mood}</div>;
}
```

### Send Chat Message
```javascript
const { sendChatMessage } = useAgentCompanion();
sendChatMessage("Hello agent!");
```

### Feed Item
```javascript
const { feedItem } = useAgentCompanion();
feedItem('coffee');  // or 'music'
```

### Make TicTacToe Move
```javascript
const { handleTicTacToeMove } = useAgentCompanion();
handleTicTacToeMove(0, 0);  // row 0, col 0
```

### Access Chat Messages
```javascript
const { chatMessages } = useAgentCompanion();
const lastMessage = chatMessages[chatMessages.length - 1];
```

### Check Processing State
```javascript
const { isProcessing } = useAgentCompanion();
if (isProcessing) {
  return <div>Agent is thinking...</div>;
}
```

## Known Issues & Workarounds

### Issue 1: Message ID Mismatch
- **Problem**: Server uses UUIDs, client uses sequential IDs
- **Impact**: Message ordering can be incorrect
- **Workaround**: Use message timestamps as secondary sort key
- **Fix**: Use server UUIDs as primary key

### Issue 2: Chat-based Auto-sync Disabled
- **Problem**: Too many chat messages for stats sync
- **Workaround**: Uses HTTP-based sync instead
- **Location**: AgentProvider.jsx lines 264-295 (commented out)

### Issue 3: Limited Error Recovery
- **Problem**: No retry on failed syncs
- **Workaround**: Manual refresh via debug panel
- **Improvement**: Add exponential backoff retry logic

## Performance Tips

1. **Don't re-render on every message**
   - Use memo() on individual message components
   - Only update visible message ranges

2. **Limit conversation history**
   - Currently sends last 3-10 messages
   - Consider pagination for long conversations

3. **Debounce stat updates**
   - Already implemented: 2-second debounce
   - Consider longer debounce for frequent updates

4. **Lazy load old messages**
   - Currently loads all on mount
   - Implement pagination

## Testing

### Debug Interface
Access at `/debug/agent` (development only)

**Test Checklist:**
- [ ] Character selection works
- [ ] Stats update on item feed
- [ ] Chat messages display
- [ ] Server state sync shows current character
- [ ] Tool execution works (test TicTacToe)
- [ ] HTTP sync method works
- [ ] Tool-based sync works
- [ ] Message export works

### Common Test Cases
1. Select character → Check stats reset
2. Feed item → Check stats increase, animation plays
3. Send chat → Check message appears, streams
4. Start game → Check board displays
5. Make move → Check board updates
6. Refresh page → Check state persists
7. Check debug panel → Compare frontend vs server state

## Integration Checklist

- [x] AgentProvider wrapped in PageLayout
- [x] Agent component rendered
- [x] agent.css imported in root.jsx
- [x] API routes created
- [x] LocalStorage persistence working
- [x] WebSocket connection established
- [x] Chat streaming implemented
- [x] Debug panel created
- [ ] Error handling improved
- [ ] Message ID system fixed
- [ ] Insights from server
- [ ] Multi-item system

## Resources

- **Agent Library Docs**: agents@0.0.113
- **AI SDK**: @ai-sdk/openai v2.0.23
- **Hydrogen Docs**: https://shopify.dev/custom-storefronts/hydrogen
- **Cloudflare Durable Objects**: https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
- **React Hooks**: https://react.dev/reference/react/hooks
