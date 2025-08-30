import { NextRequest, NextResponse } from 'next/server';
import { getUserApiKey } from '@/lib/auth-server';

// Proxy route for all agent-runtime execution endpoints
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'POST');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get the user's internal API key from session
    const internalApiKey = await getUserApiKey(request);
    
    if (!internalApiKey) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Get the agent runtime URL from environment variable
    const AGENT_RUNTIME_URL = process.env.AGENT_RUNTIME_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8081' 
        : 'https://agent-runtime-565753126849.us-east1.run.app');
    
    // Reconstruct the path
    const path = pathSegments.join('/');
    const url = `${AGENT_RUNTIME_URL}/api/executions/${path}`;
    
    // Use the internal API key for agent-runtime authentication
    const headers: HeadersInit = {
      'Authorization': `Bearer ${internalApiKey}`,
    };
    
    console.log('[Execution Proxy] Using internal API key for', url);
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    };
    
    // Add body for POST requests
    if (method === 'POST') {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    console.log('[Execution Proxy] Response status:', response.status);
    
    // Check if this is a streaming response
    if (path.includes('stream')) {
      return handleStreamingResponse(response);
    }
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Execution Proxy] Error response:', errorText);
      return NextResponse.json(
        { error: errorText || `Request failed with status ${response.status}` },
        { status: response.status }
      );
    }
    
    // Forward the response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Execution proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy execution request' },
      { status: 500 }
    );
  }
}

async function handleStreamingResponse(response: Response) {
  if (!response.body) {
    return NextResponse.json(
      { error: 'No response body from agent runtime' },
      { status: 500 }
    );
  }
  
  // Create a TransformStream to forward the SSE stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const reader = response.body.getReader();
  
  // Forward the stream chunks
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } catch (error) {
      console.error('Stream forwarding error:', error);
    } finally {
      await writer.close();
    }
  })();
  
  // Return the streaming response with proper headers
  return new NextResponse(stream.readable, {
    status: response.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}