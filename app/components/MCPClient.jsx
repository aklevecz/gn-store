import { useState, useEffect, useRef } from 'react';
import { MCPClient as MCPClientLib } from '~/lib/mcp-client';

export function MCPClient() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [serverConnected, setServerConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const initRef = useRef(false);
  const mcpClientRef = useRef(null);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initializeMCP();
    }
  }, []);

  const initializeMCP = async () => {
    try {
      setIsLoading(true);
      addMessage('system', 'Connecting to MCP server...');
      
      // Create MCP client instance
      mcpClientRef.current = new MCPClientLib('https://gn-mcp.raptorz.workers.dev', {
        debug: true,
        clientName: 'good-neighbor-mcp-client',
        clientVersion: '1.0.0'
      });
      
      // Connect to server
      const result = await mcpClientRef.current.connect();
      
      setAvailableTools(result.tools);
      setAvailableResources(result.resources);
      setSessionId(result.sessionId);
      setServerConnected(true);
      
      const toolNames = result.tools?.map(t => t.name).join(', ') || 'none';
      const resourceNames = result.resources?.map(r => r.uri).join(', ') || 'none';
      
      addMessage('system', `✅ Connected to Good Neighbor MCP server!\n🔧 Tools: ${toolNames}\n📚 Resources: ${resourceNames}`);
      
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      addMessage('system', `❌ Failed to connect: ${error.message}`);
      setServerConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() }]);
  };

  const callMCPTool = async (toolName, arguments_ = {}) => {
    try {
      if (!mcpClientRef.current) {
        throw new Error('MCP client not initialized');
      }
      
      return await mcpClientRef.current.callTool(toolName, arguments_);
    } catch (error) {
      console.error('Tool call failed:', error);
      return { error: error.message };
    }
  };

  const readMCPResource = async (resourceUri) => {
    try {
      if (!mcpClientRef.current) {
        throw new Error('MCP client not initialized');
      }
      
      return await mcpClientRef.current.readResource(resourceUri);
    } catch (error) {
      console.error('Resource read failed:', error);
      return { error: error.message };
    }
  };

  const processUserMessage = async (userMessage) => {
    setIsLoading(true);
    addMessage('user', userMessage);

    try {
      const lowerMessage = userMessage.toLowerCase();
      
      // Check for tool calls
      const toolToUse = availableTools.find(tool => 
        lowerMessage.includes(tool.name.toLowerCase()) || 
        lowerMessage.includes('fact') || 
        lowerMessage.includes('random')
      );

      if (toolToUse) {
        addMessage('system', `🔧 Calling tool: ${toolToUse.name}`);
        
        const toolResult = await callMCPTool(toolToUse.name, {});
        
        if (toolResult.error) {
          addMessage('assistant', `❌ Tool error: ${toolResult.error}`);
        } else {
          // Use the abstracted client's text extraction method
          const content = mcpClientRef.current.extractTextContent(toolResult);
          addMessage('assistant', `🌱 ${content}`);
        }
      } 
      // Check for resource requests
      else if (lowerMessage.includes('resource') || lowerMessage.includes('facts')) {
        const resourceToRead = availableResources.find(resource => 
          lowerMessage.includes('fact') || lowerMessage.includes(resource.uri)
        );
        
        if (resourceToRead) {
          addMessage('system', `📚 Reading resource: ${resourceToRead.uri}`);
          
          const resourceResult = await readMCPResource(resourceToRead.uri);
          
          if (resourceResult.error) {
            addMessage('assistant', `❌ Resource error: ${resourceResult.error}`);
          } else {
            const content = mcpClientRef.current.extractTextContent(resourceResult);
            addMessage('assistant', `📖 Resource content:\n${content}`);
          }
        } else {
          addMessage('assistant', `Available resources: ${availableResources.map(r => r.uri).join(', ') || 'none'}`);
        }
      }
      // Help message
      else if (lowerMessage.includes('help')) {
        const helpMessage = `🤖 Good Neighbor MCP Client Help:
        
Available commands:
• Type "fact" or "random" to get a random vinyl sustainability fact
• Type "resource" to list available resources
• Available tools: ${availableTools.map(t => t.name).join(', ') || 'none'}
• Available resources: ${availableResources.map(r => r.uri).join(', ') || 'none'}

Try typing: "getRandomVinylFact" or "give me a fact"`;
        addMessage('assistant', helpMessage);
      }
      else {
        // Default response
        const response = `I received: "${userMessage}"\n\n🔧 Available tools: ${availableTools.map(t => t.name).join(', ') || 'none'}\n📚 Available resources: ${availableResources.map(r => r.uri).join(', ') || 'none'}\n\nTry: "give me a vinyl fact" or "help"`;
        addMessage('assistant', response);
      }
    } catch (error) {
      addMessage('assistant', `❌ Error processing message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    processUserMessage(userMessage);
  };

  const retry = async () => {
    setMessages([]);
    setAvailableTools([]);
    setAvailableResources([]);
    setServerConnected(false);
    
    // Disconnect existing client
    if (mcpClientRef.current) {
      mcpClientRef.current.disconnect();
      mcpClientRef.current = null;
    }
    
    // Reconnect
    initRef.current = false;
    initRef.current = true;
    await initializeMCP();
  };

  const testRandomFact = async () => {
    if (!serverConnected || isLoading) return;
    
    setIsLoading(true);
    addMessage('system', '🧪 Testing getRandomVinylFact tool...');
    
    try {
      const result = await callMCPTool('getRandomVinylFact', {});
      if (result.error) {
        addMessage('assistant', `❌ Test failed: ${result.error}`);
      } else {
        const content = mcpClientRef.current.extractTextContent(result);
        addMessage('assistant', `✅ Test successful: ${content}`);
      }
    } catch (error) {
      addMessage('assistant', `❌ Test error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mcp-client">
      <div className="mcp-header">
        <h3>Good Neighbor MCP Client</h3>
        <div className={`connection-status ${serverConnected ? 'connected' : 'disconnected'}`}>
          {serverConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div className="header-buttons">
          {!serverConnected && (
            <button onClick={retry} disabled={isLoading}>
              Retry Connection
            </button>
          )}
          {serverConnected && (
            <button onClick={testRandomFact} disabled={isLoading}>
              Test Random Fact
            </button>
          )}
        </div>
      </div>

      <div className="server-info">
        <div className="info-section">
          <strong>🔧 Tools ({availableTools.length}):</strong> {availableTools.map(t => t.name).join(', ') || 'None'}
        </div>
        <div className="info-section">
          <strong>📚 Resources ({availableResources.length}):</strong> {availableResources.map(r => r.uri).join(', ') || 'None'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> 
            <pre>{msg.content}</pre>
          </div>
        ))}
        {isLoading && <div className="message system">🔄 Processing...</div>}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "give me a vinyl fact" or "help"'
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>

    </div>
  );
}