import { data } from '@shopify/remix-oxygen';
import { useLoaderData } from 'react-router';
import { useState, useEffect } from 'react';
import { useAgentCompanion } from '~/components/Agent/AgentProvider';
import { ITEMS } from '~/components/Agent/constants';

/**
 * Debug route for testing agent functionality
 * Access at: /debug/agent
 */
export async function loader({ request, context }) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    throw new Response('Not Found', { status: 404 });
  }

  return data({
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}

export default function DebugAgent() {
  const loaderData = useLoaderData();
  const { 
    selectedCharacter, 
    stats, 
    feedItem,
    mood,
    sendChatMessage,
    isProcessing,
    chatMessages,
    isInitialized,
    sessionId,
    agent
  } = useAgentCompanion();

  const [syncMethod, setSyncMethod] = useState('tool');
  const [httpSyncResult, setHttpSyncResult] = useState(null);
  const [toolTestResult, setToolTestResult] = useState(null);
  const [manualStats, setManualStats] = useState({
    happiness: 50,
    energy: 50,
    intelligence: 50
  });
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState('');
  const [toolParams, setToolParams] = useState('{}');
  const [agentUrl, setAgentUrl] = useState('');

  // Get agent URL from the actual agent connection
  useEffect(() => {
    if (agent?._url) {
      const url = agent._url.replace("ws://", "http://").replace("wss://", "https://");
      setAgentUrl(url);
      
      // Fetch available tools from the actual agent server
      const fetchTools = async () => {
        try {
          const toolsUrl = new URL(url);
          toolsUrl.pathname += '/api/debug/tools';
          
          const response = await fetch(toolsUrl.toString());
          if (response.ok) {
            const data = await response.json();
            setAvailableTools(data.tools || []);
          }
        } catch (error) {
          console.error('Failed to fetch tools:', error);
        }
      };
      
      fetchTools();
    }
  }, [agent]);

  // Update manual stats when actual stats change
  useEffect(() => {
    if (stats) {
      setManualStats(stats);
    }
  }, [stats]);

  // Don't render on server or before initialization
  if (!isInitialized || typeof window === 'undefined') {
    return null;
  }

  const testHttpSync = async () => {
    if (!selectedCharacter) {
      alert('Please select a character first');
      return;
    }
    try {
      // Construct URL properly - add path before query params
      const url = new URL(agentUrl);
      url.pathname += '/api/sync-stats';
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: sessionId,
          characterId: selectedCharacter.id,
          characterName: selectedCharacter.name,
          stats: manualStats
        })
      });

      const result = await response.json();
      setHttpSyncResult({
        timestamp: new Date().toISOString(),
        ...result
      });
    } catch (error) {
      setHttpSyncResult({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };

  const testToolSync = async () => {
    const message = `Please sync my character stats: ${selectedCharacter.name} (${selectedCharacter.id}) with happiness: ${manualStats.happiness}, energy: ${manualStats.energy}, intelligence: ${manualStats.intelligence}`;
    await sendChatMessage(message);
    setToolTestResult({
      timestamp: new Date().toISOString(),
      message: 'Sync message sent via tool'
    });
  };

  const testFeedItem = (itemId) => {
    feedItem(itemId);
    // Trigger sync after feeding if using HTTP
    if (syncMethod === 'http') {
      setTimeout(() => testHttpSync(), 500);
    }
  };

  const getAgentState = async () => {
    try {
      const url = new URL(agentUrl);
      url.pathname += '/api/debug/state';
      
      const response = await fetch(url.toString());
      const state = await response.json();
      setToolTestResult({
        timestamp: new Date().toISOString(),
        state
      });
    } catch (error) {
      setToolTestResult({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };

  const triggerTool = async () => {
    try {
      let params = {};
      if (toolParams) {
        params = JSON.parse(toolParams);
      }

      let message = '';
      switch (selectedTool) {
        case 'getWeatherInformation':
          message = `What's the weather in ${params.city || 'New York'}?`;
          break;
        case 'getLocalTime':
          message = `What time is it in ${params.location || 'Tokyo'}?`;
          break;
        case 'startTicTacToe':
          message = 'Let\'s play TicTacToe!';
          break;
        case 'debugAgentState':
          message = 'Debug the agent state';
          break;
        case 'getCharacterState':
          message = 'Show me the current character state';
          break;
        case 'getMusicKnowledge':
          message = `Tell me about ${params.topic || 'DJ Harvey'}`;
          break;
        default:
          message = `Execute ${selectedTool} with params: ${toolParams}`;
      }

      await sendChatMessage(message);
      setToolTestResult({
        timestamp: new Date().toISOString(),
        tool: selectedTool,
        params,
        message: 'Tool trigger message sent'
      });
    } catch (error) {
      setToolTestResult({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };

  const exportConversation = () => {
    const exportData = {
      sessionId,
      character: selectedCharacter,
      stats,
      messages: chatMessages,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-conversation-${sessionId}-${Date.now()}.json`;
    a.click();
  };

  if (!selectedCharacter) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>🔧 Agent Debug Interface</h1>
        <p>Please select a character first from the main app.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔧 Agent Debug Interface</h1>
      <p>Environment: {loaderData.environment} | Time: {loaderData.timestamp}</p>

      {/* Connection Status Panel */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>📡 Connection Status</h2>
        <div>Agent URL: {agentUrl || 'Not connected'}</div>
        <div>Session ID: {sessionId}</div>
        <div>WebSocket Status: {agent ? 'Connected' : 'Disconnected'}</div>
        <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
      </div>

      {/* Character State Inspector */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>🎮 Character State</h2>
        
        <h3>Frontend State (AgentProvider)</h3>
        <div>Character: {selectedCharacter.name} ({selectedCharacter.id})</div>
        <div>Current Stats:</div>
        <ul>
          <li>Happiness: {stats.happiness}/100</li>
          <li>Energy: {stats.energy}/100</li>
          <li>Intelligence: {stats.intelligence}/100</li>
        </ul>
        <div>Calculated Mood: {mood}</div>
        
        <h3>Server State</h3>
        {toolTestResult && toolTestResult.state ? (
          <div>
            <div>Character: {toolTestResult.state.character?.name} ({toolTestResult.state.character?.id})</div>
            <div>Server Stats:</div>
            <ul>
              <li>Happiness: {toolTestResult.state.character?.stats?.happiness}/100</li>
              <li>Energy: {toolTestResult.state.character?.stats?.energy}/100</li>
              <li>Intelligence: {toolTestResult.state.character?.stats?.intelligence}/100</li>
            </ul>
            <div>Server Mood: {toolTestResult.state.character?.mood}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Last Sync: {toolTestResult.state.character?.lastSync ? new Date(toolTestResult.state.character.lastSync).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        ) : (
          <div style={{ color: '#999' }}>Click "Get Server State" to see server state</div>
        )}
        
        <button onClick={getAgentState} style={{ marginTop: '10px' }}>
          Get Server State
        </button>
      </div>

      {/* Stats Sync Testing */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>🔄 Stats Sync Testing</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <h3>Manual Stats Control</h3>
          <label>
            Happiness: 
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={manualStats.happiness}
              onChange={(e) => setManualStats({...manualStats, happiness: parseInt(e.target.value)})}
            />
            {manualStats.happiness}
          </label>
          <br />
          <label>
            Energy: 
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={manualStats.energy}
              onChange={(e) => setManualStats({...manualStats, energy: parseInt(e.target.value)})}
            />
            {manualStats.energy}
          </label>
          <br />
          <label>
            Intelligence: 
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={manualStats.intelligence}
              onChange={(e) => setManualStats({...manualStats, intelligence: parseInt(e.target.value)})}
            />
            {manualStats.intelligence}
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            Sync Method: 
            <select value={syncMethod} onChange={(e) => setSyncMethod(e.target.value)}>
              <option value="tool">Tool-based (via chat)</option>
              <option value="http">HTTP endpoint</option>
            </select>
          </label>
        </div>

        <button onClick={syncMethod === 'http' ? testHttpSync : testToolSync}>
          Test {syncMethod === 'http' ? 'HTTP' : 'Tool'} Sync
        </button>

        {httpSyncResult && (
          <pre style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px' }}>
            HTTP Sync Result:
            {JSON.stringify(httpSyncResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Feed Items Testing */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>🍽️ Feed Items</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {Object.values(ITEMS).map(item => (
            <button 
              key={item.id}
              onClick={() => testFeedItem(item.id)}
              style={{ padding: '10px', cursor: 'pointer' }}
            >
              {item.name}
              <br />
              {Object.entries(item.effect).map(([stat, value]) => (
                <span key={stat}>{stat}: +{value} </span>
              ))}
            </button>
          ))}
        </div>
      </div>

      {/* Tool Testing Interface */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>🛠️ Tool Testing</h2>
        
        <div>
          <label>
            Select Tool: 
            <select value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)}>
              <option value="">-- Select Tool --</option>
              {availableTools.map(tool => (
                <option key={tool.name} value={tool.name}>
                  {tool.name} {tool.requiresConfirmation ? '(needs confirm)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label>
            Tool Parameters (JSON):
            <br />
            <textarea 
              value={toolParams}
              onChange={(e) => setToolParams(e.target.value)}
              style={{ width: '100%', height: '100px', fontFamily: 'monospace' }}
              placeholder='{"param": "value"}'
            />
          </label>
        </div>

        <button onClick={triggerTool} disabled={!selectedTool}>
          Trigger Tool
        </button>

        {toolTestResult && (
          <pre style={{ background: '#f0f0f0', padding: '10px', marginTop: '10px' }}>
            Tool Test Result:
            {JSON.stringify(toolTestResult, null, 2)}
          </pre>
        )}
      </div>

      {/* Message History */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>💬 Message History</h2>
        <div>Total Messages: {chatMessages?.length || 0}</div>
        <button onClick={exportConversation}>Export Conversation</button>
        
        <div style={{ maxHeight: '300px', overflow: 'auto', marginTop: '10px' }}>
          {chatMessages && chatMessages.slice(-10).map((msg, i) => (
            <div key={i} style={{ 
              padding: '5px', 
              background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              marginBottom: '5px'
            }}>
              <strong>{msg.role}:</strong> {
                typeof msg.content === 'string' 
                  ? msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
                  : JSON.stringify(msg.content).substring(0, 100) + '...'
              }
            </div>
          ))}
        </div>
      </div>

      {/* Debug Actions */}
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h2>🎯 Debug Actions</h2>
        <button onClick={() => window.location.reload()}>Force Reload</button>
        {' '}
        <button onClick={() => localStorage.clear()}>Clear Local Storage</button>
        {' '}
        <button onClick={() => sessionStorage.clear()}>Clear Session Storage</button>
      </div>
    </div>
  );
}