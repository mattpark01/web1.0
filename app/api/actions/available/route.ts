import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserAvailableTools } from '@/lib/actions/registry'

/**
 * GET /api/actions/available - Get user's available actions/tools
 * This endpoint is called by agent-runtime to get the tools a user can access
 */
export async function GET(request: NextRequest) {
  try {
    // Check for user authentication
    const session = await auth()
    
    // Also support API key authentication for agent-runtime
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')
    
    // Validate authentication
    if (!session?.user && !apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user ID from session or header
    const effectiveUserId = session?.user?.id || userId
    
    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }
    
    // Validate API key if provided (for agent-runtime)
    if (apiKey && apiKey !== process.env.AGENT_RUNTIME_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Get user's available tools
    const availableTools = await getUserAvailableTools(effectiveUserId)
    
    // Format response for agent-runtime
    return NextResponse.json({
      userId: effectiveUserId,
      tools: availableTools.tools.map(tool => ({
        id: tool.id,
        actionId: tool.actionId,
        platform: tool.platform,
        provider: tool.provider,
        name: tool.name,
        description: tool.description,
        icon: tool.icon,
        category: tool.category,
        executionType: tool.executionType,
        requiresAuth: tool.requiresAuth,
        requiresLLM: tool.requiresLLM,
        requiresIntegration: tool.requiresIntegration,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        agenticConfig: tool.agenticConfig,
        isActive: tool.isActive
      })),
      nativeCount: availableTools.nativeTools.length,
      integrationCount: availableTools.integrationTools.length,
      totalCount: availableTools.tools.length
    })
    
  } catch (error) {
    console.error('Failed to fetch available tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available tools' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/actions/available - Batch check if user has access to specific actions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const apiKey = request.headers.get('x-api-key')
    const userId = request.headers.get('x-user-id')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const effectiveUserId = session?.user?.id || userId
    
    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }
    
    if (apiKey && apiKey !== process.env.AGENT_RUNTIME_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    const { actionIds } = await request.json()
    
    if (!Array.isArray(actionIds)) {
      return NextResponse.json(
        { error: 'actionIds must be an array' },
        { status: 400 }
      )
    }
    
    // Get user's available tools
    const availableTools = await getUserAvailableTools(effectiveUserId)
    const availableActionIds = new Set(availableTools.tools.map(t => t.actionId))
    
    // Check which actions the user has access to
    const access = actionIds.reduce((acc, actionId) => {
      acc[actionId] = availableActionIds.has(actionId)
      return acc
    }, {} as Record<string, boolean>)
    
    return NextResponse.json({
      userId: effectiveUserId,
      access
    })
    
  } catch (error) {
    console.error('Failed to check action access:', error)
    return NextResponse.json(
      { error: 'Failed to check action access' },
      { status: 500 }
    )
  }
}