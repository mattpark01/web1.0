import { NextRequest, NextResponse } from 'next/server';
import { getUserApiKey } from '@/lib/auth-server';

// Proxy route for all agent-runtime agent endpoints
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, 'DELETE');
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
    const url = `${AGENT_RUNTIME_URL}/api/agents/${path}`;
    
    // Use the internal API key for agent-runtime authentication
    const headers: HeadersInit = {
      'Authorization': `Bearer ${internalApiKey}`,
    };
    
    console.log('[Agent Proxy] Using internal API key for', url);
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    };
    
    // Add body for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      const body = await request.json();
      fetchOptions.body = JSON.stringify(body);
      
      // Check if this is a streaming request
      if (body.stream) {
        return handleStreamingResponse(url, fetchOptions);
      }
    }
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    console.log('[Agent Proxy] Response status:', response.status);
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Agent Proxy] Error response:', errorText);
      return NextResponse.json(
        { error: errorText || `Request failed with status ${response.status}` },
        { status: response.status }
      );
    }
    
    // Forward the response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Agent proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy agent request' },
      { status: 500 }
    );
  }
}

async function handleStreamingResponse(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
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