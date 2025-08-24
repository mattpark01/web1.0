import { NextRequest, NextResponse } from 'next/server';
import { workspaceManager } from '@/services/workspace/workspace-manager';

export async function GET(request: NextRequest) {
  try {
    // Get user session (implement your auth here)
    const userId = request.headers.get('x-user-id') || 'test-user';
    
    // Get or create workspace
    const workspace = await workspaceManager.getOrCreateWorkspace(userId);
    
    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error getting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to get workspace' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const userId = request.headers.get('x-user-id') || 'test-user';
    
    const workspace = await workspaceManager.getOrCreateWorkspace(userId);
    
    switch (action) {
      case 'suspend':
        await workspaceManager.suspendWorkspace(workspace.workspace_id);
        return NextResponse.json({ status: 'suspended' });
        
      case 'resume':
        // Resume logic here
        return NextResponse.json({ status: 'resumed' });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing workspace:', error);
    return NextResponse.json(
      { error: 'Failed to manage workspace' },
      { status: 500 }
    );
  }
}