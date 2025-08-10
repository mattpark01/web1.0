import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const { publicToken, metadata } = await request.json()

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    // Store the connection in database
    // In production, associate with authenticated user
    const brokerageConnection = await prisma.brokerageConnection.create({
      data: {
        userId: 'user-id', // Get from session in production
        provider: 'plaid',
        accessToken: accessToken, // Encrypt in production
        itemId: itemId,
        institutionName: metadata.institution?.name || 'Unknown',
        accounts: JSON.stringify(accountsResponse.data.accounts),
      },
    })

    // Fetch initial investment holdings
    try {
      const holdingsResponse = await plaidClient.investmentsHoldingsGet({
        access_token: accessToken,
      })

      await prisma.holding.createMany({
        data: holdingsResponse.data.holdings.map(holding => ({
          brokerageConnectionId: brokerageConnection.id,
          symbol: holding.security_id,
          quantity: holding.quantity,
          costBasis: holding.cost_basis || 0,
          currentValue: holding.institution_value || 0,
        })),
      })
    } catch (error) {
      console.error('Error fetching holdings:', error)
    }

    return NextResponse.json({ success: true, connectionId: brokerageConnection.id })
  } catch (error) {
    console.error('Error exchanging Plaid token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}