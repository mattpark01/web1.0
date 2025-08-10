import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
  try {
    // Get user ID from session (hardcoded for now)
    const userId = 'default-user'

    // Fetch all brokerage connections for the user
    const connections = await prisma.brokerageConnection.findMany({
      where: { 
        userId,
        provider: 'plaid',
        isActive: true
      }
    })

    const allHoldings = []
    const allSecurities = []
    const allAccounts = []

    for (const connection of connections) {
      try {
        // Fetch investment holdings
        const holdingsResponse = await plaidClient.investmentsHoldingsGet({
          access_token: connection.accessToken,
        })

        allHoldings.push(...holdingsResponse.data.holdings)
        allSecurities.push(...holdingsResponse.data.securities)
        allAccounts.push(...holdingsResponse.data.accounts)

        // Update holdings in database
        for (const holding of holdingsResponse.data.holdings) {
          const security = holdingsResponse.data.securities.find(s => s.security_id === holding.security_id)
          
          if (security) {
            await prisma.holding.upsert({
              where: {
                brokerageConnectionId_symbol: {
                  brokerageConnectionId: connection.id,
                  symbol: security.ticker_symbol || security.name || holding.security_id
                }
              },
              update: {
                quantity: holding.quantity,
                costBasis: holding.cost_basis || 0,
                currentValue: holding.institution_value || (holding.quantity * (security.close_price || 0)),
                lastUpdated: new Date()
              },
              create: {
                brokerageConnectionId: connection.id,
                symbol: security.ticker_symbol || security.name || holding.security_id,
                quantity: holding.quantity,
                costBasis: holding.cost_basis || 0,
                currentValue: holding.institution_value || (holding.quantity * (security.close_price || 0))
              }
            })
          }
        }

        // Update last sync time
        await prisma.brokerageConnection.update({
          where: { id: connection.id },
          data: { lastSync: new Date() }
        })

      } catch (error) {
        console.error(`Error fetching holdings for connection ${connection.id}:`, error)
      }
    }

    // Transform data for frontend
    const portfolioData = {
      holdings: allHoldings.map(holding => {
        const security = allSecurities.find(s => s.security_id === holding.security_id)
        const account = allAccounts.find(a => a.account_id === holding.account_id)
        
        return {
          account_name: account?.name || 'Unknown Account',
          account_type: account?.subtype || account?.type || 'investment',
          symbol: security?.ticker_symbol || security?.name || 'Unknown',
          name: security?.name || 'Unknown Security',
          quantity: holding.quantity,
          price: security?.close_price || 0,
          cost_basis: holding.cost_basis || 0,
          value: holding.institution_value || 0,
          gain_loss: (holding.institution_value || 0) - (holding.cost_basis || 0),
          gain_loss_percent: holding.cost_basis 
            ? ((holding.institution_value || 0) - holding.cost_basis) / holding.cost_basis * 100 
            : 0,
          type: security?.type || 'equity'
        }
      }),
      total_value: allHoldings.reduce((sum, h) => sum + (h.institution_value || 0), 0),
      total_cost: allHoldings.reduce((sum, h) => sum + (h.cost_basis || 0), 0),
      accounts: allAccounts.map(account => ({
        id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        balance: account.balances.current || 0,
        available: account.balances.available || 0
      }))
    }

    return NextResponse.json(portfolioData)
  } catch (error: any) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investment data' },
      { status: 500 }
    )
  }
}