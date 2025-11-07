# Agent Implementation Documentation Index

This directory contains comprehensive documentation about the agent implementation in the Hydrogen/Shopify storefront application.

## Documentation Files

### 1. **AGENT_IMPLEMENTATION_OVERVIEW.md** (659 lines) - PRIMARY REFERENCE
The most comprehensive guide covering the entire agent system.

**Sections:**
- Executive Summary
- Architecture Overview with ASCII diagram
- Complete File-by-File Analysis (18 files)
  - Core Provider & State Management
  - UI Components
  - API Routes & Backend
  - Storage & Persistence
  - Configuration
- Communication Flow (4 detailed flows)
- Current Capabilities (13 features + 4 issues)
- Data Structures
- Configuration & Environment
- File Structure Summary
- Integration with Main App
- Development & Debugging Guide
- Dependencies
- Known Limitations & Todo Items
- Next Steps & Recommendations

**Best For:** Understanding the complete system, architecture, and how everything fits together.

---

### 2. **AGENT_QUICK_REFERENCE.md** (343 lines) - QUICK LOOKUP
Quick reference guide for developers working with the agent system.

**Sections:**
- File Locations Table (with line counts)
- Key Hooks & Exports (with code example)
- Configuration (constants and defaults)
- API Endpoints (POST /api/agent, GET /debug/agent)
- Message Structure
- Streaming Frame Prefixes
- LocalStorage Data Structure
- State Flow (component hierarchy & sync flow)
- Common Tasks (with code snippets)
  - Access Agent State
  - Send Chat Message
  - Feed Item
  - Make TicTacToe Move
  - Access Chat Messages
  - Check Processing State
- Known Issues & Workarounds
- Performance Tips
- Testing Checklist
- Integration Checklist
- Resources

**Best For:** Quick lookups during development, copy-paste code examples, testing checklist.

---

### 3. **AGENT_ARCHITECTURE_DIAGRAMS.md** (450+ lines) - VISUAL REFERENCE
ASCII diagrams and visual representations of the system.

**Diagrams:**
1. System Architecture - Full stack overview
2. Component Tree - React component hierarchy
3. State Management Flow - Context value structure
4. Data Flow: Chat Message - Step-by-step message lifecycle
5. Data Flow: Item Feeding - Item consumption flow
6. Data Flow: Server Sync - Synchronization process
7. Message ID Issue - Current problem visualization
8. Mood System - How mood is calculated
9. Stat Decay System - How stats decay over time
10. Tool Execution Flow - Tool invocation process
11. Legend - Diagram symbols explained

**Best For:** Visual learners, understanding data flows, explaining the system to others.

---

### 4. **AGENT_TECHNICAL_DOCUMENTATION.md** (374 lines)
Additional technical documentation (existing file).

Contains technical details and specifications of the agent system.

---

## Quick Start by Role

### For New Developers
1. Start with **AGENT_IMPLEMENTATION_OVERVIEW.md** - Executive Summary section
2. Read **AGENT_ARCHITECTURE_DIAGRAMS.md** - System Architecture and Component Tree
3. Skim **AGENT_QUICK_REFERENCE.md** - Common Tasks section

### For Backend/API Integration
1. **AGENT_QUICK_REFERENCE.md** - API Endpoints section
2. **AGENT_IMPLEMENTATION_OVERVIEW.md** - Communication Flow section
3. **AGENT_ARCHITECTURE_DIAGRAMS.md** - Data Flow diagrams

### For Frontend Development
1. **AGENT_QUICK_REFERENCE.md** - Key Hooks & Exports, Common Tasks
2. **AGENT_IMPLEMENTATION_OVERVIEW.md** - UI Components section
3. **AGENT_ARCHITECTURE_DIAGRAMS.md** - Component Tree

### For Debugging
1. **AGENT_QUICK_REFERENCE.md** - Known Issues & Workarounds
2. **AGENT_IMPLEMENTATION_OVERVIEW.md** - Development & Debugging section
3. **AGENT_ARCHITECTURE_DIAGRAMS.md** - Message ID Issue diagram

### For Performance Optimization
1. **AGENT_QUICK_REFERENCE.md** - Performance Tips
2. **AGENT_IMPLEMENTATION_OVERVIEW.md** - Known Limitations section
3. **AGENT_ARCHITECTURE_DIAGRAMS.md** - Data Flow diagrams

---

## Key Information Quick Access

### File Locations
See **AGENT_QUICK_REFERENCE.md** - File Locations section

### Configuration
See **AGENT_QUICK_REFERENCE.md** - Configuration section

Key settings:
- `AGENT_HOST = "localhost:5174"` - Server address
- `AGENT_NAME = "chat"` - Agent identifier
- Characters: Groovy (music) and Globby (eco)
- Items: Coffee (+20 energy, +10 happiness) and Music (+30 happiness)

### API Endpoints
See **AGENT_QUICK_REFERENCE.md** - API Endpoints section

```
POST /api/agent              - Main agent actions
GET /debug/agent             - Debug interface (dev-only)
GET /api/debug/state         - Get character state (server)
GET /get-messages            - Fetch message history (server)
POST /api/sync-stats         - Sync stats to server
```

### Main Hook
```javascript
import { useAgentCompanion } from '~/components/Agent/AgentProvider';
```

See **AGENT_QUICK_REFERENCE.md** - Key Hooks & Exports section

---

## System Overview

**Architecture:** 
- Frontend: React + Context API + Custom Hooks
- Backend: Cloudflare Workers + Durable Objects
- AI Model: OpenAI GPT-4
- Database: SQLite (via Durable Objects)
- Communication: WebSocket + HTTP

**Key Features:**
- Real-time streaming chat
- Character-based interaction (2 characters)
- Item feeding system
- TicTacToe game integration
- Stat management (Happiness, Energy, Intelligence)
- Message persistence
- Server synchronization
- Comprehensive debug interface

**Known Issues:**
1. Message ID mismatch (Server UUIDs vs client sequential IDs)
2. Limited error recovery on sync failures
3. Chat-based auto-sync disabled
4. No pagination for long conversations

---

## Related Files in Project

### Agent System Files
```
app/components/Agent/
├── Agent.jsx                    (142 lines) - Main widget
├── AgentProvider.jsx            (343 lines) - State management
├── AgentSelector.jsx            (41 lines)  - Character picker
├── AgentStatus.jsx              (112 lines) - Stats display
├── AgentChatTab.jsx             (94 lines)  - Chat UI
├── AgentInventory.jsx           (108 lines) - Item feeding
├── AgentTicTacToeTab.jsx        (80+ lines) - Game UI
├── useCharacterState.js         (120+ lines)- Character hook
├── useAgentServerSync.js        (100+ lines)- Sync hook
├── useAgentStreaming.js         (90+ lines) - Streaming hook
├── chatReducer.js               (187 lines) - Message reducer
└── constants.js                 (60 lines)  - Config

app/routes/
├── api.agent.jsx                (105 lines) - API endpoint
└── debug.agent.jsx              (446 lines) - Debug UI

app/lib/
├── agent-storage.js             (33 lines)  - LocalStorage
└── agent-mcp.js                 (105 lines) - API client

app/styles/
└── agent.css                    - Agent styling

app/components/
└── PageLayout.jsx               (300 lines) - Integration
```

### Related Configuration
- `package.json` - Dependencies
- `app/root.jsx` - Style imports

---

## Development Workflow

### Common Tasks

1. **Access agent state in a component:**
   ```javascript
   const { selectedCharacter, stats, mood } = useAgentCompanion();
   ```
   See: AGENT_QUICK_REFERENCE.md - Common Tasks

2. **Send chat message:**
   ```javascript
   const { sendChatMessage } = useAgentCompanion();
   sendChatMessage("Hello!");
   ```
   See: AGENT_QUICK_REFERENCE.md - Common Tasks

3. **Debug agent issues:**
   - Visit `/debug/agent` endpoint
   - See: AGENT_IMPLEMENTATION_OVERVIEW.md - Development & Debugging
   - See: AGENT_QUICK_REFERENCE.md - Testing

4. **Add new feature:**
   - See: AGENT_IMPLEMENTATION_OVERVIEW.md - Next Steps
   - Determine which file to modify
   - See: AGENT_QUICK_REFERENCE.md - File Locations

---

## Documentation Statistics

| Document | Lines | Size | Focus |
|----------|-------|------|-------|
| AGENT_IMPLEMENTATION_OVERVIEW.md | 659 | 23KB | Complete reference |
| AGENT_QUICK_REFERENCE.md | 343 | 9.5KB | Quick lookup |
| AGENT_ARCHITECTURE_DIAGRAMS.md | 450+ | 21KB | Visual reference |
| AGENT_TECHNICAL_DOCUMENTATION.md | 374 | 9.2KB | Technical specs |
| **TOTAL** | **1866+** | **62KB** | Comprehensive |

---

## Glossary

**AgentProvider** - React Context that manages all agent state and communication

**Durable Objects** - Cloudflare's stateful computing platform used for the agent backend

**WebSocket** - Real-time bidirectional communication channel between client and server

**Streaming** - Server sends response in chunks with frame prefixes (0:, 9:, a:, etc.)

**Tool** - Function that can be invoked by the agent (e.g., TicTacToe, stats sync)

**Character** - One of two agent personalities (Groovy or Globby)

**Stats** - Three numerical values representing character state (happiness, energy, intelligence)

**Mood** - Derived emotional state based on stats (sad, neutral, happy, excited)

**Item** - Something that can be fed to the character to modify stats (coffee, music)

**Message ID** - Currently problematic field with format mismatch between server and client

**Frame Prefix** - Single character that indicates message type in streaming response

---

## Questions & Troubleshooting

**Q: Where do I find the agent configuration?**
A: `app/components/Agent/constants.js` and `AGENT_QUICK_REFERENCE.md` - Configuration section

**Q: How do I access agent state?**
A: Use `useAgentCompanion()` hook. See AGENT_QUICK_REFERENCE.md - Key Hooks & Exports

**Q: How does the chat work?**
A: See AGENT_ARCHITECTURE_DIAGRAMS.md - Data Flow: Chat Message section

**Q: What's the message ID issue?**
A: Server uses UUIDs, client uses sequential IDs. See AGENT_ARCHITECTURE_DIAGRAMS.md - Message ID Issue or AGENT_IMPLEMENTATION_OVERVIEW.md - Known Issues

**Q: How do I debug the agent?**
A: Visit `/debug/agent` endpoint. See AGENT_IMPLEMENTATION_OVERVIEW.md - Development & Debugging

**Q: Where's the server code?**
A: In separate `gn-friend` repository (Cloudflare Workers/Durable Objects)

---

## Contributing

When making changes to the agent system:
1. Update this documentation
2. Reflect changes in the appropriate markdown file
3. Update file line counts in AGENT_QUICK_REFERENCE.md if needed
4. Note any new issues in AGENT_IMPLEMENTATION_OVERVIEW.md

---

## Last Updated

Documentation generated: November 6, 2025

For the latest information, check:
- Git commit history
- Code comments in agent files
- `/debug/agent` endpoint for real-time state

