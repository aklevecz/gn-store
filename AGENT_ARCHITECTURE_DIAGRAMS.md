# Agent Implementation - Architecture Diagrams

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HYDROGEN FRONTEND                            │
│                   (React + TypeScript)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           PageLayout.jsx (Integration Point)            │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         AgentProvider (Context + State)                 │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ State Management                                   │ │   │
│  │  │ • selectedCharacter (groovy/globby)               │ │   │
│  │  │ • stats (happiness, energy, intelligence)         │ │   │
│  │  │ • inventory, insights, mood                       │ │   │
│  │  │ • chatMessages, currentGame, isProcessing         │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Hooks (Logic Layer)                                │ │   │
│  │  │ • useCharacterState (stats/items/decay)           │ │   │
│  │  │ • useAgentServerSync (periodic sync)              │ │   │
│  │  │ • useAgentStreaming (WebSocket messages)          │ │   │
│  │  │ • useReducer(chatReducer) (message ordering)      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       │                                          │
│  ┌────┬──────┬────────┼───────┬─────────┬──────────────────┐    │
│  ▼    ▼      ▼        ▼       ▼         ▼                  ▼    │
│ Agent AgentAgent  Agent   Agent    API         Storage        │
│Widget Selector Status   Chat   Inventory   Routes    (Local)    │
│ (UI)   (Modal) (Stats)  (Chat)  (Items)     │      localStorage │
│  │      │       │       │       │           │          │       │
│  └──────┴───────┴───────┴───────┴───────────┼──────────┴───────┘
│                                             │
│                                             ▼
│                        ┌──────────────────────────────┐
│                        │   HTTP API Routes            │
│                        │ • /api/agent                 │
│                        │ • /debug/agent               │
│                        │ • /api/sync-stats            │
│                        └──────────────────────────────┘
│                                             │
└─────────────────────────────┬───────────────┼──────────────────┘
                              │ WebSocket     │ HTTP
                              │               │
                    ┌─────────▼───────────────▼────────┐
                    │  Cloudflare Workers               │
                    │  + Durable Objects                │
                    ├──────────────────────────────────┤
                    │                                  │
                    │ ┌──────────────────────────────┐ │
                    │ │  AIChatAgent (Extended)      │ │
                    │ │  ┌────────────────────────┐  │ │
                    │ │  │ Tools                  │  │ │
                    │ │  │ • TicTacToe            │  │ │
                    │ │  │ • getMusicKnowledge    │  │ │
                    │ │  │ • getEcoKnowledge      │  │ │
                    │ │  │ • syncCharacterStats   │  │ │
                    │ │  └────────────────────────┘  │ │
                    │ │                              │ │
                    │ │ ┌────────────────────────┐  │ │
                    │ │ │ OpenAI Integration     │  │ │
                    │ │ │ (GPT-4 via @ai-sdk)    │  │ │
                    │ │ └────────────────────────┘  │ │
                    │ └──────────────────────────────┘ │
                    │                                  │
                    │ ┌──────────────────────────────┐ │
                    │ │  SQLite Database             │ │
                    │ │  • Messages (with UUIDs)     │ │
                    │ │  • Character state           │ │
                    │ │  • Conversation history      │ │
                    │ └──────────────────────────────┘ │
                    └──────────────────────────────────┘
```

## 2. Component Tree

```
PageLayout
  └─ AgentProvider
      ├─ Toast.Provider
      │   ├─ CartAside
      │   ├─ SearchAside
      │   ├─ MobileMenuAside
      │   └─ main content
      │
      └─ Agent
          ├─ (If no character selected)
          │   └─ AgentSelector (Modal)
          │       ├─ Groovy card
          │       └─ Globby card
          │
          └─ (If character selected)
              ├─ agent-widget
              │   ├─ Toggle Button
              │   │   └─ agent-avatar (with mood image)
              │   │       └─ Notification indicator
              │   │
              │   └─ agent-panel (when visible)
              │       ├─ agent-header
              │       │   ├─ Character name
              │       │   └─ Current mood
              │       │
              │       ├─ agent-body
              │       │   ├─ agent-character
              │       │   │   └─ Character image/animation
              │       │   │
              │       │   ├─ agent-actions (Tab buttons)
              │       │   │   ├─ Stats
              │       │   │   ├─ Treat
              │       │   │   ├─ Game
              │       │   │   └─ Chat
              │       │   │
              │       │   └─ Tab Content
              │       │       ├─ AgentStatus
              │       │       │   ├─ agent-stats-detailed
              │       │       │   │   ├─ Happiness stat
              │       │       │   │   ├─ Energy stat
              │       │       │   │   └─ Intelligence stat
              │       │       │   ├─ agent-insights
              │       │       │   └─ agent-tips
              │       │       │
              │       │       ├─ AgentInventory
              │       │       │   ├─ inventory-tabs
              │       │       │   └─ inventory-grid
              │       │       │       ├─ Coffee item
              │       │       │       └─ Music item
              │       │       │
              │       │       ├─ AgentTicTacToeTab
              │       │       │   ├─ tictactoe-header
              │       │       │   │   ├─ New Game button
              │       │       │   │   └─ Clear Game button
              │       │       │   ├─ TicTacToeBoard
              │       │       │   │   └─ 9 cells (3x3)
              │       │       │   └─ Game status
              │       │       │
              │       │       └─ AgentChatTab
              │       │           ├─ chat-header
              │       │           ├─ chat-messages
              │       │           │   ├─ user-message
              │       │           │   ├─ assistant-message
              │       │           │   └─ typing indicator
              │       │           └─ chat-input-form
```

## 3. State Management Flow

```
┌──────────────────────────────────────────┐
│  AgentProvider Context Value             │
├──────────────────────────────────────────┤
│                                          │
│  selectedCharacter                       │
│    └─→ CHARACTERS[id]                    │
│                                          │
│  stats (from useCharacterState)          │
│    ├─→ happiness (0-100)                 │
│    ├─→ energy (0-100)                    │
│    └─→ intelligence (0-100)              │
│                                          │
│  mood (derived)                          │
│    └─→ getMood(stats)                    │
│        └─→ sad/neutral/happy/excited     │
│                                          │
│  inventory                               │
│    └─→ Array of { item, timestamp }      │
│                                          │
│  insights                                │
│    └─→ Array of { id, text, timestamp }  │
│                                          │
│  chatMessages (from chatReducer)         │
│    └─→ Array of messages with tools      │
│                                          │
│  currentGame (from TicTacToe)            │
│    ├─→ board (3x3 array)                 │
│    ├─→ currentPlayer (X/O)               │
│    ├─→ winner                            │
│    └─→ gameActive (boolean)              │
│                                          │
└──────────────────────────────────────────┘
```

## 4. Data Flow: Chat Message

```
User Input
  │
  ├─ User types "Hello"
  │
  ├─ onClick → handleChatSubmit()
  │
  ├─ sendChatMessage("Hello")
  │
  ├─ Build message object:
  │  {
  │    id: "randomMessageId",
  │    type: "cf_agent_use_chat_request",
  │    url: "http://localhost:5174",
  │    init: {
  │      method: "POST",
  │      body: JSON.stringify({
  │        messages: [
  │          ...conversationHistory (last 10),
  │          { role: "user", content: "Hello" }
  │        ]
  │      })
  │    }
  │  }
  │
  ├─ agent.send(message)  // WebSocket
  │
  ├─ dispatchChat({ type: 'ADD_USER_MESSAGE', content: "Hello" })
  │  └─→ chatReducer adds user message to state
  │
  ├─ React re-renders with new message
  │
  └─→ Server (Durable Objects)
      │
      ├─ Receives HTTP POST
      │
      ├─ Processes via OpenAI
      │
      ├─ Streams response back:
      │  0:{text chunk 1}
      │  0:{text chunk 2}
      │  9:{tool call start}
      │  a:{tool result}
      │  e:{usage stats}
      │  (done with empty body)
      │
      └─→ Client receives streaming
          │
          ├─ handleStreamingResponse()
          │
          ├─ Each frame prefix:
          │  0: STREAM_TEXT → dispatchChat STREAM_TEXT
          │  9: TOOL_START → dispatchChat TOOL_START
          │  a: TOOL_RESULT → dispatchChat TOOL_RESULT
          │  e/d: USAGE → dispatchChat USAGE
          │
          ├─ chatReducer builds message incrementally
          │
          └─ React updates UI with each chunk
```

## 5. Data Flow: Item Feeding

```
User clicks "Coffee"
  │
  ├─ onClick → handleFeedItem('coffee')
  │
  ├─ feedItem('coffee')  // from useCharacterState
  │
  ├─ Find item in ITEMS: { id, name, effect }
  │
  ├─ Update local stats immediately:
  │  newStats = {
  │    happiness: clampStat(current + 10),
  │    energy: clampStat(current + 20),
  │    intelligence: clampStat(current + 5)
  │  }
  │  setStats(newStats)
  │
  ├─ Play animation:
  │  setPlayingAnimation('coffee')
  │  → Renders <video src="/animations/groovy_coffee.mp4" />
  │  setTimeout(() => setPlayingAnimation(null), 6000)
  │
  ├─ HTTP POST to /api/sync-stats:
  │  {
  │    characterId: 'groovy',
  │    characterName: 'Groovy',
  │    stats: newStats
  │  }
  │
  ├─ Sync response received
  │
  ├─ Update inventory:
  │  inventory = [...prev, { item: 'coffee', timestamp }]
  │
  └─ localStorage.setItem('goodneighbor_agent', JSON.stringify(state))
```

## 6. Data Flow: Server Sync

```
Initial Load (useAgentServerSync)
  │
  ├─ useEffect on mount with [agent._url, selectedCharacter]
  │
  ├─ fetchServerState()
  │  └─→ GET /api/debug/state
  │      └─→ Returns { character: {...}, stats: {...} }
  │
  ├─ Compare timestamps:
  │  serverLastSync vs localLastSync
  │
  ├─→ If server is newer:
  │  ├─ setSelectedCharacter(serverCharacter)
  │  ├─ setStats(serverStats)
  │  └─ setLastInteraction(serverTimestamp)
  │
  └─ Periodic Sync (every 10 seconds)
      │
      ├─ useEffect with interval
      │
      ├─ fetchServerState() again
      │
      ├─ Check if character changed
      │
      └─→ If changed:
          └─ Update local state
```

## 7. Message ID Issue (Current Problem)

```
┌─────────────────┐
│ Server Storage  │
├─────────────────┤
│ ID Format       │
│                 │
│ msg_abc123xyz   │
│ msg_def456uvw   │
│ msg_ghi789rst   │
│                 │
│ (UUIDs)         │
└────────┬────────┘
         │
         │ GET /get-messages
         │
         ▼
┌──────────────────────────────────┐
│ Client Receives (correct)         │
├──────────────────────────────────┤
│ [                                │
│   { id: "msg_abc123xyz", ... },  │
│   { id: "msg_def456uvw", ... },  │
│   { id: "msg_ghi789rst", ... }   │
│ ]                                │
└────────┬─────────────────────────┘
         │
         │ dispatchChat SET_MESSAGES
         │
         ▼
┌──────────────────────────────────────┐
│ normalizeMessages()                  │
├──────────────────────────────────────┤
│                                      │
│ Expects format: "role:number"        │
│ Regex: /^(?:user|assistant|..):(\d+)/ │
│                                      │
│ UUID doesn't match → sequence = 0    │
│                                      │
│ Problem! Max sequence incorrectly    │
│ calculated, new messages get wrong   │
│ sequential IDs                       │
└────────┬───────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Client Creates New Message       │
├──────────────────────────────────┤
│                                  │
│ User sends: "Hello"              │
│                                  │
│ ID Generated: "user:1"           │
│ (Should be: "user:4" since 3 exist) │
│                                  │
│ Sent to server with "user:1"     │
│                                  │
│ Server stores with NEW UUID:     │
│ msg_new123abc                    │
│                                  │
│ Client never learns of UUID      │
│ ID divergence grows              │
└──────────────────────────────────┘

Solution: Accept server UUIDs as source of truth
```

## 8. Mood System

```
Stats (0-100)
  │
  ├─→ happiness
  └─→ energy
  │
  ├─ Calculate average: (happiness + energy) / 2
  │
  └─→ avgMood
      │
      ├─ >= 80 → excited  🤩
      │         └─→ /characters/groovy-jump.png
      │
      ├─ >= 60 → happy 😊
      │         └─→ /characters/groovy-thumbsup.png
      │
      ├─ >= 40 → neutral 😐
      │         └─→ /characters/groovy-stand.png
      │
      └─ < 40  → sad 😢
              └─→ /characters/groovy-sad.png
```

## 9. Stat Decay System

```
Every 60 seconds (interval)
  │
  ├─ Calculate time since last interaction
  │  timeSinceInteraction = now - lastInteraction
  │
  ├─ Calculate hours elapsed
  │  hoursElapsed = timeSinceInteraction / (1000 * 60 * 60)
  │
  ├─ If hoursElapsed > 1:
  │  └─ Apply decay:
  │     ├─ happiness -= 2 (per check)
  │     ├─ energy -= 3 (per check)
  │     └─ intelligence -= 1 (per check)
  │
  └─ All stats clamped to [0, 100]
```

## 10. Tool Execution Flow

```
User: "Let's play TicTacToe"
  │
  ├─ sendChatMessage("Let's play TicTacToe")
  │
  ├─ Detected as tool call (hardcoded check)
  │
  ├─ Send with minimal context (last 3 messages)
  │
  └─→ Server
      │
      ├─ Invokes startTicTacToe tool
      │
      ├─ Stream back:
      │  9:{toolCall}
      │  a:{toolResult}
      │
      └─→ Client
          │
          ├─ TOOL_START → Add tool to message
          │
          ├─ TOOL_RESULT → Store result
          │  {
          │    toolName: "startTicTacToe",
          │    result: {
          │      board: [[...], [...], [...]],
          │      currentPlayer: "X",
          │      gameActive: true
          │    }
          │  }
          │
          ├─ updateGameStateFromTool()
          │
          ├─ setCurrentGame({ board, currentPlayer, ... })
          │
          └─ React re-renders TicTacToeTab with board
```

---

## Legend

```
─────  Connection/Flow
   │   Vertical flow
   ├─  Branch
   └─  Terminal branch
   ▼   Direction indicator
  ...  Omitted details
  []   Array
  {}   Object
  |→   Process/Call
```
