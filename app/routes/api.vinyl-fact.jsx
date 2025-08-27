import { MCPClient } from '~/lib/mcp-client';

export async function loader() {
  try {
    const client = new MCPClient('https://gn-mcp.raptorz.workers.dev', {
      debug: false,
      clientName: 'api-route-client'
    });
    console.log('client', client)
    await client.connect();
    console.log('client connected')
    const result = await client.callTool('getRandomVinylFact');
    console.log('result', result)
    const text = client.extractTextContent(result);
    console.log('text', text)
    return Response.json({ 
      success: true, 
      fact: text,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function action({ request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { toolName, arguments: args } = await request.json();
    
    const client = new MCPClient('https://gn-mcp.raptorz.workers.dev', {
      debug: false,
      clientName: 'api-action-client'
    });
    console.log('client', client)
    await client.connect();
    console.log('client connected')
    const result = await client.callTool(toolName, args || {});
    console.log('result', result)
    const text = client.extractTextContent(result);
    console.log('text', text)
    return Response.json({ 
      success: true, 
      result: text,
      toolName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}