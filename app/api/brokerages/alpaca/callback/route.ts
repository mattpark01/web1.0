import { NextRequest, NextResponse } from 'next/server'
import Alpaca from '@alpacahq/alpaca-trade-api'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect('/portfolio?error=authorization_failed')
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.alpaca.markets/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.ALPACA_CLIENT_ID || '',
        client_secret: process.env.ALPACA_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/brokerages/alpaca/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect('/portfolio?error=token_exchange_failed')
    }

    // Initialize Alpaca client with the access token
    const alpaca = new Alpaca({
      keyId: tokenData.access_token,
      secretKey: '', // Not needed for OAuth
      paper: false,
      usePolygon: false,
    })

    // Get account information
    const account = await alpaca.getAccount()

    // Store the connection in database
    const brokerageConnection = await prisma.brokerageConnection.create({
      data: {
        userId: 'user-id', // Get from session in production
        provider: 'alpaca',
        accessToken: tokenData.access_token, // Encrypt in production
        refreshToken: tokenData.refresh_token,
        accountId: account.id,
        institutionName: 'Alpaca Markets',
        accounts: JSON.stringify([account]),
      },
    })

    // Fetch and store positions
    const positions = await alpaca.getPositions()
    
    if (positions.length > 0) {
      await prisma.holding.createMany({
        data: positions.map((position: any) => ({
          brokerageConnectionId: brokerageConnection.id,
          symbol: position.symbol,
          quantity: parseFloat(position.qty),
          costBasis: parseFloat(position.cost_basis),
          currentValue: parseFloat(position.market_value),
        })),
      })
    }

    return NextResponse.redirect('/portfolio?success=alpaca_connected')
  } catch (error) {
    console.error('Error in Alpaca callback:', error)
    return NextResponse.redirect('/portfolio?error=connection_failed')
  }
}