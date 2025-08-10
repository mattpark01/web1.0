import { NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'

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

export async function POST(request: Request) {
  try {
    const { public_token, metadata } = await request.json()
    
    // For now, use a default user ID - you should get this from session
    const userId = 'default-user' // Replace with actual user authentication

    // Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const { access_token, item_id } = tokenResponse.data

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token,
    })

    const accounts = accountsResponse.data.accounts
    const institution = metadata?.institution || {}

    // Store accounts in database
    for (const account of accounts) {
      await prisma.bankAccount.upsert({
        where: {
          plaidAccountId: account.account_id,
        },
        update: {
          currentBalance: account.balances.current || null,
          availableBalance: account.balances.available || null,
          creditLimit: account.balances.limit || null,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: userId,
          plaidAccountId: account.account_id,
          plaidItemId: item_id,
          plaidAccessToken: access_token,
          name: account.name,
          officialName: account.official_name,
          type: account.type,
          subtype: account.subtype || '',
          mask: account.mask || '',
          currentBalance: account.balances.current || null,
          availableBalance: account.balances.available || null,
          creditLimit: account.balances.limit || null,
          institution: institution.name || 'Unknown',
          currency: account.balances.iso_currency_code || 'USD',
          lastSyncedAt: new Date(),
        },
      })
    }

    // Fetch initial transactions
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    try {
      const transactionsResponse = await plaidClient.transactionsGet({
        access_token,
        start_date: thirtyDaysAgo.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
      })

      const transactions = transactionsResponse.data.transactions

      // Store transactions
      for (const transaction of transactions) {
        const account = await prisma.bankAccount.findUnique({
          where: { plaidAccountId: transaction.account_id },
        })

        if (account) {
          await prisma.transaction.upsert({
            where: {
              plaidTransactionId: transaction.transaction_id,
            },
            update: {
              amount: transaction.amount,
              date: new Date(transaction.date),
              name: transaction.name,
              merchantName: transaction.merchant_name,
              category: transaction.category || [],
              pending: transaction.pending,
            },
            create: {
              accountId: account.id,
              plaidTransactionId: transaction.transaction_id,
              amount: transaction.amount,
              date: new Date(transaction.date),
              name: transaction.name,
              merchantName: transaction.merchant_name,
              category: transaction.category || [],
              pending: transaction.pending,
            },
          })
        }
      }
    } catch (txError) {
      console.log('Could not fetch initial transactions:', txError)
    }

    return NextResponse.json({ 
      success: true,
      item_id,
      accounts: accounts.length,
    })
  } catch (error) {
    console.error('Error exchanging public token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange public token' },
      { status: 500 }
    )
  }
}