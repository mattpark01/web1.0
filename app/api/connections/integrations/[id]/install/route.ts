import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// OAuth configuration (would normally be in env vars)
const OAUTH_CONFIGS = {
  'google-calendar': {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar'],
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/connections/oauth/callback`,
  },
  'linear': {
    clientId: process.env.LINEAR_CLIENT_ID,
    clientSecret: process.env.LINEAR_CLIENT_SECRET,
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    scopes: ['read', 'write'],
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/connections/oauth/callback`,
  },
  'plaid': {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    environment: process.env.PLAID_ENV || 'sandbox',
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/connections/plaid/callback`,
  },
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const integrationId = params.id
    const body = await request.json()
    const { settings } = body
    
    // TODO: Get actual user ID from auth
    const userId = 'user-123' // Mock user ID
    
    // Check if integration exists in catalog
    const catalogEntry = await prisma.integrationCatalog.findUnique({
      where: { integrationId },
    }).catch(() => null)
    
    if (!catalogEntry) {
      // If not in DB, check mock data
      if (!['google-calendar', 'linear', 'plaid', 'github-issues'].includes(integrationId)) {
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        )
      }
    }
    
    // Check if already installed
    const existingInstallation = catalogEntry ? await prisma.userIntegration.findUnique({
      where: {
        userId_catalogId: {
          userId,
          catalogId: catalogEntry.id,
        },
      },
    }).catch(() => null) : null
    
    if (existingInstallation?.isInstalled) {
      return NextResponse.json(
        { error: 'Integration already installed' },
        { status: 400 }
      )
    }
    
    // Create or update user integration record
    if (catalogEntry) {
      await prisma.userIntegration.upsert({
        where: {
          userId_catalogId: {
            userId,
            catalogId: catalogEntry.id,
          },
        },
        update: {
          isInstalled: false, // Will be set to true after OAuth
          settings,
        },
        create: {
          userId,
          catalogId: catalogEntry.id,
          isInstalled: false,
          settings,
        },
      }).catch(console.error)
    }
    
    // Generate installation ID for tracking
    const installationId = crypto.randomBytes(16).toString('hex')
    
    // Handle different auth types
    const authType = catalogEntry?.authType || 'oauth2'
    
    if (authType === 'oauth2') {
      // Generate OAuth URL
      const config = OAUTH_CONFIGS[integrationId as keyof typeof OAUTH_CONFIGS]
      
      if (!config) {
        // Return mock OAuth URL for demo
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        return NextResponse.json({
          installationId,
          status: 'pending',
          authUrl: `${baseUrl}/api/connections/oauth/mock?integration=${integrationId}&installation=${installationId}`,
          requiresApiKey: false,
          nextSteps: 'Complete OAuth authentication to connect your account',
        })
      }
      
      // Build real OAuth URL
      const state = Buffer.from(JSON.stringify({
        integrationId,
        installationId,
        userId,
      })).toString('base64')
      
      const authParams = new URLSearchParams({
        client_id: config.clientId || '',
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: Array.isArray(config.scopes) ? config.scopes.join(' ') : '',
        state,
        access_type: 'offline', // For Google
        prompt: 'consent', // For Google
      })
      
      const authUrl = `${config.authUrl}?${authParams.toString()}`
      
      return NextResponse.json({
        installationId,
        status: 'pending',
        authUrl,
        requiresApiKey: false,
        nextSteps: 'Complete OAuth authentication to connect your account',
      })
      
    } else if (authType === 'api_key') {
      // API key integrations
      return NextResponse.json({
        installationId,
        status: 'pending',
        requiresApiKey: true,
        nextSteps: 'Provide your API key to complete the connection',
      })
      
    } else {
      // No auth required
      if (catalogEntry) {
        await prisma.userIntegration.update({
          where: {
            userId_catalogId: {
              userId,
              catalogId: catalogEntry.id,
            },
          },
          data: {
            isInstalled: true,
            installedAt: new Date(),
          },
        }).catch(console.error)
      }
      
      return NextResponse.json({
        installationId,
        status: 'active',
        requiresApiKey: false,
        nextSteps: 'Integration installed successfully',
      })
    }
    
  } catch (error) {
    console.error('Failed to install integration:', error)
    return NextResponse.json(
      { error: 'Failed to install integration' },
      { status: 500 }
    )
  }
}