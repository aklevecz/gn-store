import { MCPClient } from '~/components/MCPClient';
import { MCPClient as MCPClientLib } from '~/lib/mcp-client';

export async function loader() {
  try {
    // const client = new MCPClientLib('https://gn-mcp.raptorz.workers.dev', {
    //   debug: false,
    //   clientName: 'mcp-page-loader'
    // });
    
    // await client.connect();
    // const result = await client.callTool('getRandomVinylFact');
    // const vinylFact = client.extractTextContent(result);
    const vinylFact = "test"
    return {
      vinylFact,
      success: true,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Failed to load vinyl fact:', error);
    return {
      vinylFact: 'Failed to load vinyl fact from MCP server',
      success: false,
      error: error.message
    };
  }
}

export default function MCPPage({ loaderData }) {
  return (
    <div>
      <h1>MCP Client Test</h1>
      <p>This is a simple test interface to connect to your MCP server at https://gn-mcp.raptorz.workers.dev</p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        margin: '20px 0', 
        borderRadius: '8px', 
        border: '1px solid #e9ecef' 
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>🌱 Random Vinyl Sustainability Fact</h3>
        <p style={{ 
          margin: 0, 
          fontSize: '16px', 
          lineHeight: '1.5',
          fontStyle: loaderData?.success ? 'normal' : 'italic',
          color: loaderData?.success ? '#333' : '#666'
        }}>
          {loaderData?.vinylFact}
        </p>
        {loaderData?.success && (
          <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
            Generated server-side at {new Date(loaderData.timestamp).toLocaleString()}
          </small>
        )}
      </div>
      
      <MCPClient />
    </div>
  );
}

export const meta = () => {
  return [
    { title: 'MCP Client Test' },
    { name: 'description', content: 'Test interface for MCP server connection' }
  ];
};