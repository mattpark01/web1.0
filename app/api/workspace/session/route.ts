import { NextRequest, NextResponse } from 'next/server';
import { workspaceManager } from '@/services/workspace/workspace-manager';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await request.json();
    const userId = request.headers.get('x-user-id') || 'test-user';
    
    // Create a new session
    const session = await workspaceManager.createSession(workspaceId, userId);
    
    // Generate WebSocket URL for terminal connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.spatiolabs.org';
    
    return NextResponse.json({
      session,
      wsUrl: `${wsUrl}/terminal?token=${session.session_token}`,
      cloudRunUrl: session.workspaces?.service_url
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}