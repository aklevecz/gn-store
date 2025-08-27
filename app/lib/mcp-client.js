export class MCPClient {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.sessionId = null;
    this.isConnected = false;
    this.tools = [];
    this.resources = [];
    this.clientInfo = {
      name: options.clientName || 'mcp-client',
      version: options.clientVersion || '1.0.0'
    };
    this.protocolVersion = options.protocolVersion || '2024-11-05';
    this.debug = options.debug || false;
  }

  log(message, data = null) {
    if (this.debug) {
      console.log(`[MCPClient] ${message}`, data || '');
    }
  }

  async makeJsonRpcRequest(method, params = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      };
      
      // Add session ID for all non-initialize requests
      if (method !== 'initialize' && this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }
      
      this.log(`Making request: ${method}`, { params, headers });
      
      const response = await fetch(`${this.serverUrl}/mcp`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: method,
          params: params
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      // Get session ID from headers (before consuming response body)
      const sessionIdFromHeaders = response.headers.get('mcp-session-id');
      if (sessionIdFromHeaders && !this.sessionId) {
        this.sessionId = sessionIdFromHeaders;
        this.log(`Session ID received: ${sessionIdFromHeaders}`);
      }
      
      const responseText = await response.text();
      this.log(`Response received for ${method}`, responseText);
      
      // Parse JSON (handle both SSE and regular JSON formats)
      let data;
      if (responseText.includes('data: {')) {
        const jsonPart = responseText.split('data: ')[1];
        data = JSON.parse(jsonPart);
      } else {
        data = JSON.parse(responseText);
      }
      
      if (data.error) {
        throw new Error(`MCP Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (error) {
      this.log(`Request failed: ${method}`, error);
      throw error;
    }
  }

  async connect() {
    try {
      this.log('Connecting to MCP server...');
      
      // Initialize the MCP session
      await this.makeJsonRpcRequest('initialize', {
        protocolVersion: this.protocolVersion,
        capabilities: {},
        clientInfo: this.clientInfo
      });
      
      this.log('MCP session initialized');
      
      // List available tools
      const toolsResult = await this.makeJsonRpcRequest('tools/list');
      this.tools = toolsResult.tools || [];
      this.log(`Discovered ${this.tools.length} tools`, this.tools.map(t => t.name));
      
      // Try to list resources (optional)
      try {
        const resourcesResult = await this.makeJsonRpcRequest('resources/list');
        this.resources = resourcesResult.resources || [];
        this.log(`Discovered ${this.resources.length} resources`, this.resources.map(r => r.uri));
      } catch (resourceError) {
        this.log('Resources not available', resourceError.message);
        this.resources = [];
      }
      
      this.isConnected = true;
      this.log('Successfully connected to MCP server');
      
      return {
        success: true,
        tools: this.tools,
        resources: this.resources,
        sessionId: this.sessionId
      };
      
    } catch (error) {
      this.log('Connection failed', error);
      this.isConnected = false;
      throw error;
    }
  }

  async callTool(toolName, args = {}) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found. Available tools: ${this.tools.map(t => t.name).join(', ')}`);
    }

    this.log(`Calling tool: ${toolName}`, args);

    try {
      const result = await this.makeJsonRpcRequest('tools/call', {
        name: toolName,
        arguments: args
      });
      
      this.log(`Tool call successful: ${toolName}`, result);
      return result;
    } catch (error) {
      this.log(`Tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  async readResource(resourceUri) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const resource = this.resources.find(r => r.uri === resourceUri);
    if (!resource) {
      throw new Error(`Resource '${resourceUri}' not found. Available resources: ${this.resources.map(r => r.uri).join(', ')}`);
    }

    this.log(`Reading resource: ${resourceUri}`);

    try {
      const result = await this.makeJsonRpcRequest('resources/read', {
        uri: resourceUri
      });
      
      this.log(`Resource read successful: ${resourceUri}`, result);
      return result;
    } catch (error) {
      this.log(`Resource read failed: ${resourceUri}`, error);
      throw error;
    }
  }

  getAvailableTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  getAvailableResources() {
    return this.resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description
    }));
  }

  // Helper method to extract text content from MCP responses
  extractTextContent(mcpResponse) {
    if (!mcpResponse) return '';
    
    if (mcpResponse.content) {
      if (Array.isArray(mcpResponse.content)) {
        return mcpResponse.content
          .map(c => c.text || JSON.stringify(c))
          .join('\n');
      } else if (mcpResponse.content.text) {
        return mcpResponse.content.text;
      }
    }
    
    return JSON.stringify(mcpResponse, null, 2);
  }

  disconnect() {
    this.isConnected = false;
    this.sessionId = null;
    this.tools = [];
    this.resources = [];
    this.log('Disconnected from MCP server');
  }

  // Status getters
  get status() {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      toolCount: this.tools.length,
      resourceCount: this.resources.length,
      serverUrl: this.serverUrl
    };
  }
}