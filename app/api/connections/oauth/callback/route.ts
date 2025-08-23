import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/lib/connections/core/connection-manager'

/**
 * GET /api/connections/oauth/callback
 * Handle OAuth callback from providers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/connections?error=${error}`
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/connections?error=invalid_response`
      )
    }
    
    // Handle the OAuth callback
    const result = await connectionManager.handleOAuthCallback(code, state)
    
    if (result.success) {
      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/connections?success=connected`
      )
    } else {
      // Redirect with error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/connections?error=${encodeURIComponent(result.error || 'connection_failed')}`
      )
    }
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/connections?error=callback_failed`
    )
  }
}