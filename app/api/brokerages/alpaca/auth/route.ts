import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const alpacaOAuthUrl = new URL('https://app.alpaca.markets/oauth/authorize')
  
  alpacaOAuthUrl.searchParams.append('response_type', 'code')
  alpacaOAuthUrl.searchParams.append('client_id', process.env.ALPACA_CLIENT_ID || '')
  alpacaOAuthUrl.searchParams.append('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/brokerages/alpaca/callback`)
  alpacaOAuthUrl.searchParams.append('scope', 'account:write trading data')
  alpacaOAuthUrl.searchParams.append('state', generateStateToken())

  return NextResponse.redirect(alpacaOAuthUrl.toString())
}

function generateStateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}