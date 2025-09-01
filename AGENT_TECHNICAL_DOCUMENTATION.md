# GN Friend Agent System - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [WebSocket Communication](#websocket-communication)
6. [State Management](#state-management)
7. [Features](#features)
8. [API Endpoints](#api-endpoints)

---

## Overview

The GN Friend Agent System is an interactive virtual companion built on Cloudflare's Agent framework. It provides users with persistent, character-based AI companions that maintain state across sessions, respond to user interactions, and engage through various activities.

### Key Features
- Two unique characters (Groovy and Globby) with distinct personalities
- Persistent stats system (happiness, energy, intelligence)
- Item feeding mechanism with stat effects
- Real-time chat with AI responses
- Interactive TicTacToe game
- Session persistence using Cloudflare Durable Objects

---

## Architecture

### Technology Stack
- **Frontend**: React 18+ with Remix
- **Backend**: Cloudflare Workers with Durable Objects
- **AI Integration**: Cloudflare Agent framework (agents/react)
- **State Management**: React Context API with useReducer
- **Persistence**: LocalStorage (client) + Durable Objects (server)

### Component Hierarchy
```
AgentProvider (Context + State Management)
└── Agent (Main Component)
    ├── AgentSelector (Character Selection)
    ├── AgentStatus (Stats Display)
    ├── AgentInventory (Item Feeding)
    ├── AgentChatTab (Chat Interface)
    └── AgentTicTacToeTab (Game Interface)
```

---

## Core Components

### 1. AgentProvider (`app/components/Agent/AgentProvider.jsx`)

The central state management component that handles:
- WebSocket connection management
- Message streaming and processing
- Character state synchronization
- Chat history management
- Stats decay over time

**Key State Variables:**
- `selectedCharacter`: Currently active character
- `stats`: Character stats (happiness, energy, intelligence)
- `chatMessages`: Conversation history
- `isProcessing`: Chat processing state
- `currentGame`: TicTacToe game state

### 2. Agent Component (`app/components/Agent/Agent.jsx`)

Main UI component featuring:
- Floating widget interface
- Tab-based navigation (Stats, Treat, Game, Chat)
- Character mood visualization
- Minimizable/expandable panel

### 3. Character System

**Available Characters:**
```javascript
CHARACTERS = {
  GROOVY: {
    id: 'groovy',
    name: 'Groovy',
    description: 'The music enthusiast - vinyl expert and music historian',
    moods: {
      happy: '/characters/groovy-thumbsup.png',
      neutral: '/characters/groovy-stand.png',
      sad: '/characters/groovy-sad.png',
      excited: '/characters/groovy-jump.png'
    }
  },
  GLOBBY: {
    id: 'globby',
    name: 'Globby',
    description: 'The eco-warrior - sustainability expert and green living guru',
    moods: {
      happy: '/characters/globby-thumbsup.png',
      neutral: '/characters/globby-thumbsup.png',
      sad: '/characters/globby-sad.png',
      excited: '/characters/globby-jump.png'
    }
  }
}
```

### 4. Item System

**Music Items:**
- Vinyl Record: +15 happiness
- Concert Ticket: +25 happiness
- Music Note: +5 happiness

**Eco Items:**
- Solar Power: +20 energy
- Recycled Materials: +10 intelligence
- Organic Snack: +10 energy, +5 happiness
- Plant Seeds: +10 happiness, +5 intelligence
- Reusable Water Bottle: +15 energy
- Compost: +15 intelligence

---

## Data Flow

### 1. Session Management
```
User Session Creation:
1. Generate unique session ID (user-xxxxx)
2. Store in localStorage for persistence
3. Use as instance name for Durable Object isolation
4. Each user gets isolated agent instance
```

### 2. Message Flow
```
User Input → AgentProvider.sendChatMessage() 
→ WebSocket (cf_agent_use_chat_request)
→ Cloudflare Agent Server
→ AI Processing
→ Streaming Response (cf_agent_use_chat_response)
→ AgentProvider.handleStreamingResponse()
→ UI Update
```

### 3. Stats Synchronization
```
Local Stats Change → Save to localStorage
                  ↓
                  → Periodic sync to server (every 10s)
                  → Server state fetch for validation
                  → Update local state if server is newer
```

---

## WebSocket Communication

### Message Types

**Outgoing:**
- `cf_agent_use_chat_request`: User messages to agent

**Incoming:**
- `cf_agent_use_chat_response`: Streaming AI responses
- `cf_agent_mcp_servers`: MCP server status (filtered)
- `cf_agent_state`: Agent state updates (filtered)

### Streaming Protocol

Messages use prefix-based framing:
- `0:` Text content
- `9:` Tool invocation start
- `a:` Tool result
- `d/e:` Usage statistics
- `f:` Metadata

### Connection Management
```javascript
const agent = useAgent({
  agent: "chat",           // Agent name
  host: "localhost:5174",   // Server host
  name: instanceName        // Unique user instance
});
```

---

## State Management

### 1. Chat State (useReducer)

**Actions:**
- `ADD_USER_MESSAGE`: Add user message
- `STREAM_TEXT`: Update streaming content
- `TOOL_START`: Begin tool execution
- `TOOL_RESULT`: Receive tool output
- `STREAM_COMPLETE`: Finalize message
- `SET_MESSAGES`: Restore history
- `CLEAR_MESSAGES`: Reset conversation

### 2. Character Stats

**Stat Ranges:** 0-100

**Mood Calculation:**
```javascript
avgMood = (happiness + energy) / 2
- >= 80: excited
- >= 60: happy
- >= 40: neutral
- < 40: sad
```

**Decay System:**
- Runs every minute
- Happiness: -2/hour
- Energy: -3/hour
- Intelligence: -1/hour

### 3. Persistence Layers

**Client-Side (localStorage):**
- Character selection
- Current stats
- Inventory history
- Insights
- Session ID

**Server-Side (Durable Objects):**
- Chat history
- Character state
- Game state
- Session data

---

## Features

### 1. Chat System
- Real-time streaming responses
- Tool invocation support
- Message history persistence
- Session restoration on reload

### 2. TicTacToe Game
- Interactive board
- AI opponent integration
- Tool-based move handling
- Visual game state updates

### 3. Item Feeding
- Stat boost effects
- Animation feedback
- Type-based filtering (Music/Eco)
- Character preferences

### 4. Debug Interface (`/debug/agent`)
- Connection status monitoring
- Manual stat control
- Tool testing interface
- Message history export
- Server state inspection

---

## API Endpoints

### Agent Server Endpoints

**GET `/get-messages`**
- Retrieves conversation history
- Called on component mount
- Returns array of message objects

**GET `/api/debug/state`**
- Returns current agent state
- Used for periodic synchronization
- Includes character data and stats

**GET `/api/debug/tools`**
- Lists available agent tools
- Used by debug interface

**POST `/api/sync-stats`**
- HTTP-based stats synchronization
- Alternative to chat-based sync
- Body: `{ agentId, characterId, characterName, stats }`

---

## Performance Optimizations

### 1. Debouncing
- Stats sync: 2-second debounce
- Prevents excessive server calls

### 2. Periodic Sync
- Server state check: Every 10 seconds
- Only updates if server state is newer

### 3. Message Filtering
- WebSocket heartbeat messages filtered
- Reduces chat UI noise

### 4. Lazy Initialization
- Character images loaded on demand
- Components render only when initialized

---

## Security Considerations

### 1. Session Isolation
- Each user gets unique Durable Object instance
- Sessions isolated by instance name
- No cross-user data leakage

### 2. Input Validation
- Tool parameters validated
- Stats clamped to valid ranges (0-100)
- Message content sanitized

### 3. State Integrity
- Server state takes precedence in conflicts
- Timestamps used for sync ordering
- Duplicate message IDs normalized

---

## Known Limitations

1. **Message ID Collisions**: Historical issue with duplicate IDs, mitigated by normalization
2. **WebSocket Reconnection**: Manual page reload required on disconnect
3. **Stats Persistence**: Relies on periodic sync, may lose recent changes on crash
4. **Browser Compatibility**: Requires modern browser with WebSocket support

---

## Future Enhancements

1. **Additional Characters**: Expand character roster
2. **More Games**: Add variety beyond TicTacToe
3. **Achievement System**: Track milestones and rewards
4. **Multi-character Support**: Allow multiple active companions
5. **Enhanced AI Tools**: More interactive capabilities
6. **Real-time Multiplayer**: Shared experiences between users

---

## Development Notes

### Environment Variables
- `NODE_ENV`: Development/production mode
- Agent host configured in AgentProvider (currently hardcoded)

### Testing Recommendations
1. Use `/debug/agent` route for development
2. Monitor WebSocket messages in browser DevTools
3. Check localStorage for persistence issues
4. Verify Durable Object state via debug endpoints

### Common Issues & Solutions

**Issue**: Messages appearing duplicated
**Solution**: Check for message ID normalization in SET_MESSAGES reducer

**Issue**: Stats not syncing
**Solution**: Verify periodic sync interval is running, check server connectivity

**Issue**: Character mood not updating
**Solution**: Ensure stats are within valid ranges, check mood calculation logic

**Issue**: WebSocket messages cluttering chat
**Solution**: Add message type to filter list in handleMessage function