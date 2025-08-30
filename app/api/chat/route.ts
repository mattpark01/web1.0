import { NextRequest, NextResponse } from 'next/server';

// This is a proxy route to the agent-runtime service
// It prevents exposing the actual Cloud Run URL to the client
export async function POST(request: NextRequest) {
  try {
    // Get the agent runtime URL from environment variable (server-side only)
    const AGENT_RUNTIME_URL = process.env.AGENT_RUNTIME_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8081' 
        : 'https://agent-runtime-565753126849.us-east1.run.app');
    
    // Get the request body
    const body = await request.json();
    
    // Forward the authorization header if present
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('[Chat Proxy] Forwarding auth header:', authHeader.substring(0, 20) + '...');
    } else {
      console.log('[Chat Proxy] No auth header found in request');
    }
    
    console.log('[Chat Proxy] Forwarding to:', `${AGENT_RUNTIME_URL}/api/chat`);
    
    // Forward the request to agent-runtime
    const response = await fetch(`${AGENT_RUNTIME_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('[Chat Proxy] Response status:', response.status);
    
    // If it's not a streaming response, just return the JSON
    if (!body.stream) {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Chat Proxy] Error response:', errorText);
        return NextResponse.json(
          { error: errorText || `Request failed with status ${response.status}` },
          { status: response.status }
        );
      }
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    
    // For streaming responses, forward the stream
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
    
  } catch (error) {
    console.error('Chat proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy chat request' },
      { status: 500 }
    );
  }
}