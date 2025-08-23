import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectionManager } from '@/lib/connections/core/connection-manager'

/**
 * POST /api/connections/install
 * Install a new connection for the user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { providerId, redirectUri, metadata } = body
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }
    
    // Install connection
    const result = await connectionManager.installConnection(
      user.id,
      providerId,
      {
        redirectUri,
        metadata,
        source: 'web',
      }
    )
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Failed to install connection:', error)
    return NextResponse.json(
      { error: 'Failed to install connection' },
      { status: 500 }
    )
  }
}