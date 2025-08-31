# Session Persistence in Agent Chat

## How useAgentChat Handles Message History

The `useAgentChat` hook from the agents library automatically handles session persistence through the following mechanism:

### 1. Automatic Message Fetching
- On component mount, `useAgentChat` automatically calls the `/get-messages` endpoint
- Uses a request cache to avoid duplicate fetches for the same agent URL
- The endpoint returns the full conversation history from the agent's durable object storage

### 2. Cache Management
```javascript
var requestCache = new Map();

function doGetInitialMessages(getInitialMessagesOptions) {
  if (requestCache.has(agentUrlString)) {
    return requestCache.get(agentUrlString); // Return cached promise
  }
  const promise = getInitialMessagesFetch(getInitialMessagesOptions);
  requestCache.set(agentUrlString, promise); // Cache the promise
  return promise;
}
```

### 3. Default Fetch Implementation
```javascript
async function defaultGetInitialMessagesFetch({ url }) {
  const getMessagesUrl = new URL(url);
  getMessagesUrl.pathname += "/get-messages";
  const response = await fetch(getMessagesUrl.toString(), {
    credentials: options.credentials,
    headers: options.headers
  });
  return response.json();
}
```

## Manual Implementation in AgentChatEXAMPLE.jsx

Since `useAgentChat` wasn't compatible with our React version, I implemented the same pattern manually:

### 1. Message History Fetching
```javascript
useEffect(() => {
  const fetchInitialMessages = async () => {
    try {
      // Convert WebSocket URL to HTTP for fetching
      const agentUrl = agent._url.replace("ws://", "http://").replace("wss://", "https://");
      const getMessagesUrl = new URL(agentUrl);
      getMessagesUrl.pathname += "/get-messages";
      
      const response = await fetch(getMessagesUrl.toString());
      if (response.ok) {
        const initialMessages = await response.json();
        if (initialMessages && initialMessages.length > 0) {
          // Convert server message format to our component format
          const convertedMessages = initialMessages.map((msg, index) => ({
            id: msg.id || `restored-${index}`,
            role: msg.role,
            status: 'complete',
            content: msg.content,
            tools: msg.toolInvocations || [],
            usage: msg.usage
          }));
          
          // Initialize state with fetched messages
          dispatch({ type: 'SET_MESSAGES', messages: convertedMessages });
        }
      }
    } catch (error) {
      console.log('Failed to fetch initial messages:', error);
    }
  };
  
  fetchInitialMessages();
}, [agent]);
```

### 2. Session Persistence
- **Session ID**: Generate consistent session ID per component instance
- **Conversation History**: Include full message history in each request
- **State Management**: Use `useReducer` to handle complex message state

### 3. Message Sending with History
```javascript
const sendChatMessage = (content) => {
  // Build conversation history from current messages
  const conversationHistory = state.messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt || new Date().toISOString()
    }));
  
  // Add new user message to history
  const newUserMessage = {
    id: Math.random().toString(36).substring(2, 8),
    role: "user",
    content: content,
    createdAt: new Date().toISOString()
  };
  
  // Send complete conversation context to agent
  const message = {
    id: messageId,
    type: "cf_agent_use_chat_request",
    url: agentUrl,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...conversationHistory, newUserMessage],
        sessionId: sessionId // Include session ID for persistence
      })
    }
  };
};
```

## Key Differences

| Aspect | useAgentChat | Manual Implementation |
|--------|-------------|---------------------|
| **Caching** | Built-in request cache with Map | No caching (fetches on every mount) |
| **Error Handling** | Silent failure | Console logging |
| **Message Format** | Automatic conversion | Manual message format conversion |
| **Integration** | Uses `useChat` from AI SDK | Custom `useReducer` state management |

## Benefits of Manual Implementation

1. **Full Control**: Complete visibility into the session persistence mechanism
2. **Debugging**: Easy to add logging and inspect message flow
3. **Customization**: Can modify behavior for specific use cases
4. **Compatibility**: Works with any React version without dependency issues

The manual implementation replicates the core functionality of `useAgentChat` while providing transparency into how session persistence actually works with Cloudflare Agents.