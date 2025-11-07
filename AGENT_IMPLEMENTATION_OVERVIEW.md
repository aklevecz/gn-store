# Hydrogen/Shopify App Agent Implementation - Complete Overview

## Executive Summary

This Hydrogen/Shopify storefront application includes a sophisticated AI agent companion system that allows users to interact with two distinct character-based agents (Groovy and Globby) in a Durable Objects-based architecture. The agent system is built on the `agents` library v0.0.113 and uses WebSocket connections to enable real-time chat, game functionality, and character state management.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Hydrogen/React)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           AgentProvider (Context Management)             │   │
│  │  - Character Selection                                   │   │
│  │  - Stats Management (Happiness, Energy, Intelligence)    │   │
│  │  - Chat State (Messages, Streaming)                      │   │
│  │  - Game State (TicTacToe)                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────────┐    │
│  ▼                                      ▼                  ▼    │
│ Agent UI                          API Routes            Storage │
│ ├─ AgentSelector                ├─ /api/agent        localStorage│
│ ├─ AgentStatus                  ├─ /debug/agent           │     │
│ ├─ AgentChat                    └─ /api/sync-stats       │     │
│ ├─ AgentInventory                                        │     │
│ └─ AgentTicTacToe                                        │     │
└────────────────┬──────────────────────────────────────────────┘
                 │ WebSocket
                 │ (via agents library)
                 │
        ┌────────▼──────────┐
        │  Cloudflare Workers
        │  + Durable Objects
        │  (gn-friend service)
        │
        │  ┌──────────────┐
        │  │  Agent Logic │
        │  │  - OpenAI    │
        │  │  - Tools     │
        │  │  - State     │
        │  └──────────────┘
        │
        │  ┌──────────────┐
        │  │   SQLite DB  │
        │  │  - Messages  │
        │  │  - Character │
        │  └──────────────┘
        └───────────────────┘
```

## Key Components & Files

### 1. **Core Agent Provider & State Management**

#### **File: `app/components/Agent/AgentProvider.jsx`** (343 lines)
- **Purpose**: Central context provider managing all agent state and communication
- **Key Responsibilities**:
  - Creates WebSocket connection to agent server via `useAgent()` hook
  - Manages character selection and stats (happiness, energy, intelligence)
  - Handles chat message streaming and processing
  - Manages TicTacToe game state
  - Syncs state with server via HTTP endpoints
  - Persists user session with localStorage

**Key Exports:**
```javascript
export function AgentProvider({ children })  // Context wrapper
export function useAgentCompanion()           // Hook for accessing agent context
```

**State Structure:**
```javascript
{
  selectedCharacter,     // Current character (groovy/globby)
  stats,                 // { happiness, energy, intelligence } (0-100)
  inventory,             // Array of fed items
  insights,              // Array of generated insights
  mood,                  // Derived mood (sad/neutral/happy/excited)
  isVisible,             // UI visibility state
  isInitialized,         // Initial load flag
  playingAnimation,      // Current animation playing
  chatMessages,          // Array of chat messages
  isProcessing,          // Chat processing flag
  currentGame,           // TicTacToe game state
  agent,                 // WebSocket connection object
}
```

#### **File: `app/components/Agent/useCharacterState.js`** (120+ lines)
- **Purpose**: Custom hook for character-specific state management
- **Key Features**:
  - Handles character selection and initialization
  - Manages stat decay over time
  - Feeds items to character with effects
  - Syncs stats to server on feed actions
  - Generates insights

#### **File: `app/components/Agent/useAgentServerSync.js`** (100+ lines)
- **Purpose**: Handles synchronization with Durable Objects server
- **Key Features**:
  - Initial server state fetch on connection
  - Periodic sync (every 10 seconds)
  - Fetches initial messages from `/get-messages` endpoint
  - Converts server messages to client format

#### **File: `app/components/Agent/useAgentStreaming.js`** (90+ lines)
- **Purpose**: Handles WebSocket streaming from agent server
- **Key Features**:
  - Processes frame-prefixed messages
  - Handles text streaming (prefix: `0`)
  - Processes tool calls (prefix: `9`)
  - Processes tool results (prefix: `a`)
  - Handles usage data (prefix: `e`/`d`)

#### **File: `app/components/Agent/chatReducer.js`** (187 lines)
- **Purpose**: Redux-style reducer for chat state management
- **Actions**:
  - `ADD_USER_MESSAGE` - Adds user messages with sequential IDs
  - `STREAM_TEXT` - Streams assistant text
  - `TOOL_START` - Marks tool invocation start
  - `TOOL_RESULT` - Stores tool execution results
  - `STREAM_COMPLETE` - Finalizes streaming message
  - `SET_MESSAGES` - Bulk load messages
  - `CLEAR_MESSAGES` - Resets chat

**Streaming Frame Prefixes:**
```javascript
0: FRAME_TEXT         // "0:..."
9: FRAME_TOOL_START   // "9:{toolCall}"
a: FRAME_TOOL_RESULT  // "a:{result}"
e: FRAME_USAGE_E      // Token usage (encoded)
d: FRAME_USAGE_D      // Token usage (decoded)
f: FRAME_META         // Metadata
```

### 2. **UI Components**

#### **File: `app/components/Agent/Agent.jsx`** (142 lines)
- **Purpose**: Main agent widget component
- **Features**:
  - Floating agent avatar with mood-based images
  - Multi-tab interface
  - Notification indicator for low happiness

**Tabs:**
- **Stats**: View character stats with visual progress bars
- **Treat**: Feed items to character (Coffee, Music)
- **Game**: Play TicTacToe with the agent
- **Chat**: Direct chat interface

#### **File: `app/components/Agent/AgentSelector.jsx`** (41 lines)
- **Purpose**: Character selection modal
- **Characters Available**:
  1. **Groovy**: Music enthusiast and vinyl expert
  2. **Globby**: Eco-warrior and sustainability expert

#### **File: `app/components/Agent/AgentStatus.jsx`** (112 lines)
- **Purpose**: Displays character stats and insights
- **Features**:
  - Visual stat bars with color coding
  - Status labels (Excellent/Good/Fair/Low/Critical)
  - Recent insights display
  - Character-specific tips based on stats

#### **File: `app/components/Agent/AgentInventory.jsx`** (108 lines)
- **Purpose**: Item feeding interface
- **Items Available**:
  - Coffee: +20 energy, +10 happiness, +5 intelligence
  - Music: +30 happiness

#### **File: `app/components/Agent/AgentChatTab.jsx`** (94 lines)
- **Purpose**: Chat interface for agent interaction
- **Features**:
  - Message display with role-based styling
  - Typing indicator
  - Auto-scroll to latest message
  - Clear chat history button

#### **File: `app/components/Agent/AgentTicTacToeTab.jsx`** (80+ lines)
- **Purpose**: TicTacToe game interface
- **Features**:
  - Board display via TicTacToeBoard component
  - Optimistic move predictions
  - New Game / Clear Game controls

### 3. **API Routes & Backend Integration**

#### **File: `app/routes/api.agent.jsx`** (105 lines)
- **Endpoint**: `POST /api/agent`
- **Purpose**: Unified agent API endpoint (mock implementation)
- **Actions**:
  - `getInsight` - Generate character insights
  - `feedItem` - Process item feeding
  - `updateStats` - Update stats
  - `getRecommendation` - Get character recommendations

#### **File: `app/routes/debug.agent.jsx`** (446 lines)
- **Endpoint**: `GET /debug/agent`
- **Purpose**: Comprehensive debug interface (dev-only, disabled in production)
- **Features**:
  - Connection status panel
  - Character state inspector (frontend vs server)
  - Manual stats control with sliders
  - HTTP vs Tool-based sync testing
  - Feed items testing
  - Tool invocation testing
  - Message history export
  - Agent state debugging

### 4. **Storage & Persistence**

#### **File: `app/lib/agent-storage.js`** (33 lines)
- **Purpose**: LocalStorage persistence layer
- **Storage Key**: `goodneighbor_agent`
- **Persisted Data**:
  ```javascript
  {
    character,      // Current character object
    stats,          // Character stats
    inventory,      // Fed items history
    lastInteraction,// Timestamp
    insights        // Array of insights
  }
  ```

#### **File: `app/lib/agent-mcp.js`** (105 lines)
- **Purpose**: Client-side API wrapper for agent endpoints
- **Functions**:
  - `fetchAgentInsight(context)`
  - `sendFeedAction(itemId)`
  - `syncAgentStats(stats)`
  - `getAgentRecommendation(context)`

### 5. **Configuration**

#### **File: `app/components/Agent/constants.js`** (60 lines)
**Agent Configuration:**
```javascript
AGENT_HOST = "localhost:5174"           // Local dev server
ENV_PROTOCOL = "http" | "https"         // Based on NODE_ENV
AGENT_NAME = "chat"                     // Agent instance name

CHARACTERS = {
  GROOVY: {
    id: 'groovy',
    name: 'Groovy',
    description: 'Music enthusiast',
    moods: {
      happy: '/characters/groovy-thumbsup.png',
      neutral: '/characters/groovy-stand.png',
      sad: '/characters/groovy-sad.png',
      excited: '/characters/groovy-jump.png',
    }
  },
  GLOBBY: { /* similar structure */ }
}

ITEMS = {
  COFFEE: { id: 'coffee', name: 'Coffee', effect: {...} },
  MUSIC_TREAT: { id: 'music', name: 'Music', effect: {...} }
}

DEFAULT_STATS = {
  happiness: 75,
  energy: 75,
  intelligence: 50,
}

getMood(stats)  // Derives mood from average happiness/energy
```

### 6. **Integration Points**

#### **File: `app/components/PageLayout.jsx`** (300 lines)
- **Integration Point**: Application layout wrapper
- **Usage**: Wraps entire app with `AgentProvider` and renders `<Agent />` component
- **Location**: Lines 14-15, 57, 93-94

#### **File: `app/styles/agent.css`**
- **Purpose**: Styling for agent widget and all related components
- **Key Classes**:
  - `.agent-widget` - Main floating widget
  - `.agent-panel` - Expanded panel
  - `.agent-header` / `.agent-body` - Panel sections
  - `.agent-actions` - Tab buttons
  - `.agent-status` / `.agent-chat-tab` / etc. - Tab content

#### **File: `package.json`** (Dependencies)
```json
"agents": "^0.0.113",           // Agent framework
"@ai-sdk/openai": "^2.0.23",    // OpenAI integration
"@ai-sdk/react": "^2.0.28",     // React hooks for AI
"use-mcp": "^0.0.21"            // MCP support
```

## Communication Flow

### 1. **WebSocket Handshake (Connection)**

```
Client (AgentProvider)
  ├─ generateRandomSessionId()
  ├─ generateUniqueInstanceName() from localStorage
  └─ useAgent({
       agent: "chat",
       host: "localhost:5174",
       name: instanceName  // Creates separate DO per user
     })
    │
    └─→ WebSocket connection established
        (fires agent.onopen event)
```

### 2. **Chat Message Flow**

```
User types message
  │
  ├─→ handleChatSubmit()
  │
  ├─→ sendChatMessage(content)
  │   ├─ Builds conversation history (last 3-10 messages)
  │   ├─ Detects if tool call (TicTacToe, stats sync, etc.)
  │   └─ Sends WebSocket message:
  │       {
  │         id: messageId,
  │         type: "cf_agent_use_chat_request",
  │         url: agentUrl,
  │         init: {
  │           method: "POST",
  │           body: JSON.stringify({ messages: [...] })
  │         }
  │       }
  │
  ├─ dispatchChat({ ADD_USER_MESSAGE, ... })
  │
  └─→ Server processes and streams response
      │
      ├─ Frame 0: "0:..."  → Text content
      ├─ Frame 9: "9:{...}"→ Tool start
      ├─ Frame a: "a:{...}"→ Tool result
      ├─ Frame e/d: "....." → Usage data
      │
      └─→ handleStreamingResponse() processes each frame
          ├─ STREAM_TEXT updates message.content
          ├─ TOOL_START/RESULT builds message.tools array
          └─ STREAM_COMPLETE finalizes message
```

### 3. **Character State Sync**

```
Initial Load
  └─→ useAgentServerSync() hook
      ├─ Fetches /api/debug/state from server
      ├─ Compares lastSync timestamps
      └─ Updates local state if server is newer

Periodic Sync (every 10 seconds)
  └─→ setInterval callback
      ├─ Fetches server state
      └─ Updates character/stats if changed

On Feed Item
  └─→ feedItem(itemId)
      ├─ Updates local stats immediately
      ├─ Sends HTTP POST to /api/sync-stats
      └─ Server persists in Durable Object

On Chat (Optional)
  └─→ Chat-based sync (currently disabled)
      └─ Could send: "Please sync my stats..."
```

### 4. **Message ID System (Current Issue)**

**Problem Identified:**
- Server generates UUID IDs: `"msg_abc123xyz789"`
- Client expects: `"user:1"`, `"assistant:2"` format
- normalization fails, sequence counters break

**Flow:**
```
Server stores messages with UUIDs
  │
  └─→ Client fetches /get-messages
      │
      └─→ Receives UUID IDs
          │
          ├─→ chatReducer.normalizeMessages()
          │   └─ Tries to parse with regex /^(?:user|assistant|system|error):(\d+)/
          │       └─ FAILS on UUIDs, sequence = 0
          │
          └─→ New client messages get wrong sequence IDs
              └─ Potential ID collisions
```

**Fix Required:** Accept server UUIDs as authoritative source of truth.

## Current Capabilities

### Implemented Features
1. ✅ **Character Selection**: Choose between Groovy and Globby
2. ✅ **Character Stats**: Happiness, Energy, Intelligence (0-100)
3. ✅ **Mood System**: Derived from stats (sad/neutral/happy/excited)
4. ✅ **Item Feeding**: Coffee and Music items with stat effects
5. ✅ **Animations**: Character animations on item feed
6. ✅ **Chat Interface**: Real-time streaming chat with character
7. ✅ **Tool Execution**: TicTacToe and other tools via chat
8. ✅ **Game System**: TicTacToe gameplay with optimistic moves
9. ✅ **Stat Decay**: Stats decay over time (after 1 hour idle)
10. ✅ **Insights**: Character-specific insights generation
11. ✅ **State Persistence**: LocalStorage persistence
12. ✅ **Server Sync**: Periodic state synchronization
13. ✅ **Debug Interface**: Comprehensive dev debug panel

### Known Issues
1. ❌ **Message ID Mismatch**: Server UUIDs vs client sequential IDs
2. ❌ **Chat-based Auto-sync**: Disabled to reduce chat noise
3. ❌ **Multiple Users**: Durable Objects instance per user works but message sharing unclear
4. ❌ **Error Recovery**: Limited error handling in sync operations

## Data Structures

### Character Structure
```javascript
{
  id: 'groovy' | 'globby',
  name: 'Groovy' | 'Globby',
  description: string,
  defaultImage: string,
  moods: {
    happy: string (image path),
    neutral: string,
    sad: string,
    excited: string
  },
  lastSync: timestamp (added at runtime)
}
```

### Stats Structure
```javascript
{
  happiness: 0-100,    // How happy the character is
  energy: 0-100,       // How much energy/activity
  intelligence: 0-100  // How smart/learned
}
```

### Message Structure
```javascript
{
  id: string,              // UUID from server or "role:seq" format
  role: 'user' | 'assistant' | 'system' | 'error',
  content: string,         // Message text
  status: 'complete' | 'streaming',
  tools: [                 // Tool invocations (optional)
    {
      toolCallId: string,
      toolName: string,
      result: any
    }
  ],
  usage: {                 // Token usage (optional)
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  }
}
```

### Game State Structure
```javascript
{
  board: [[string, string, string], ...],  // 3x3 array of '' | 'X' | 'O'
  message: string,
  currentPlayer: 'X' | 'O',
  winner: null | 'X' | 'O' | 'draw',
  gameActive: boolean,
  lastMove: [row, col],
  action: string,          // Action performed
  toolName: string,        // Which tool created this state
  timestamp: number
}
```

## Configuration & Environment

**Key Settings:**
```javascript
// Location: app/components/Agent/constants.js
AGENT_HOST = "localhost:5174"  // Dev server address
AGENT_NAME = "chat"            // Agent instance identifier
ENV_PROTOCOL = "http" | "https" // Based on NODE_ENV
```

**Session Management:**
```javascript
// Session ID: Random string (not used for correlation)
// Instance Name: Used to create separate DO instances per user
// Storage Key: 'gn-friend-user-session' (localStorage)
```

## File Structure Summary

```
app/
├── components/
│   ├── Agent/
│   │   ├── Agent.jsx                    # Main widget component
│   │   ├── AgentProvider.jsx            # Context & state management
│   │   ├── AgentSelector.jsx            # Character picker
│   │   ├── AgentStatus.jsx              # Stats display
│   │   ├── AgentChat.jsx                # Chat interface
│   │   ├── AgentChatTab.jsx             # Chat tab content
│   │   ├── AgentInventory.jsx           # Item feeding UI
│   │   ├── AgentTicTacToeTab.jsx        # Game interface
│   │   ├── useCharacterState.js         # Character state hook
│   │   ├── useAgentServerSync.js        # Server sync hook
│   │   ├── useAgentStreaming.js         # WebSocket streaming hook
│   │   ├── chatReducer.js               # Chat state reducer
│   │   └── constants.js                 # Config & enums
│   └── PageLayout.jsx                   # Integration point
├── routes/
│   ├── api.agent.jsx                    # Agent API endpoint
│   └── debug.agent.jsx                  # Debug interface
├── lib/
│   ├── agent-storage.js                 # LocalStorage wrapper
│   └── agent-mcp.js                     # API client
└── styles/
    └── agent.css                        # Agent styling
```

## Integration with Main App

The agent is fully integrated into the Hydrogen storefront:

1. **PageLayout Wrapper** (app/components/PageLayout.jsx):
   - Wraps entire app with `<AgentProvider>`
   - Renders `<Agent />` component at bottom level
   - Ensures agent is available on all pages

2. **Style Integration** (app/root.jsx):
   - Imports agent.css at line 34
   - Agent styles loaded with all other app styles

3. **Database Integration**:
   - Uses Durable Objects SQLite for persistence
   - Syncs with separate gn-friend service (Cloudflare Workers)

4. **API Routes**:
   - `/api/agent` - Main agent endpoint
   - `/debug/agent` - Debug interface (dev-only)

## Development & Debugging

### Debug Interface (`/debug/agent`)
The application includes a comprehensive debug interface accessible at `/debug/agent` (disabled in production):

**Panels:**
1. **Connection Status**
   - Agent URL
   - Session ID
   - WebSocket status
   - Processing state

2. **Character State Inspector**
   - Frontend state (AgentProvider)
   - Server state (Durable Object)
   - Last sync timestamp

3. **Stats Sync Testing**
   - Manual stat controls (sliders)
   - HTTP vs Tool-based sync methods
   - Sync result display

4. **Feed Items Testing**
   - Grid of all available items
   - Test each item's effect

5. **Tool Testing**
   - Select from available tools
   - Pass custom parameters
   - View tool execution results

6. **Message History**
   - Last 10 messages display
   - Export conversation as JSON

### Logging
Extensive console logging throughout:
- `🆔 Generated new user session`
- `🔗 AgentProvider: Agent URL`
- `💌 AgentProvider: Sending message with ID`
- `🎯 AgentProvider: Tool call detected`
- `📜 AgentProvider: Regular chat`

## Dependencies

**Critical Dependencies:**
```json
{
  "agents": "^0.0.113",           // Agent framework (Cloudflare)
  "@ai-sdk/openai": "^2.0.23",    // OpenAI API
  "@ai-sdk/react": "^2.0.28",     // React AI hooks
  "use-mcp": "^0.0.21",           // MCP protocol support
  "react": "^18.2.0",             // React
  "react-router": "7.6.0"         // Routing
}
```

## Known Limitations & Todo Items

From TODO_AGENT.md:
- [ ] Get insights from server (currently mock)
- [ ] Sync stats with server and client (partially done)
- [ ] Sync items with server and client
- [ ] Create notion of tokens/currency
- [ ] Generate mood-specific images

## Next Steps / Recommendations

1. **Fix Message ID System**
   - Accept server UUIDs as authoritative
   - Only use sequential IDs for temporary local messages
   - Map client IDs to server IDs after confirmation

2. **Implement Real Insights**
   - Replace mock insights in `/api/agent`
   - Connect to character knowledge base
   - Store insights in Durable Object state

3. **Add Error Recovery**
   - Implement retry logic for failed syncs
   - Handle disconnections gracefully
   - Add user-facing error notifications

4. **Optimize Performance**
   - Implement message pagination
   - Lazy load older conversations
   - Reduce full history sending

5. **Expand Item System**
   - Add more item types
   - Implement item inventory limits
   - Create progression/unlocks

6. **Multi-User Features**
   - Share agents/conversations
   - Collaborative gameplay
   - Leaderboards

## Conclusion

The agent system is a well-architected feature that combines real-time WebSocket communication with a character-based interaction model. The implementation demonstrates proper separation of concerns with custom hooks, context-based state management, and clear component hierarchy. While there are some known issues around message ID handling and error recovery, the system is functional and provides an engaging user experience for interacting with AI-powered companion characters.
