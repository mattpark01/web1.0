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

export async function POST(request: Request) {
  try {
    const { 
      accountId, 
      amount, 
      type, // 'debit' or 'credit'
      description,
      recipientAccountId // For account-to-account transfers
    } = await request.json()

    // Get the account from database
    const account = await prisma.bankAccount.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // First, we need to create a transfer authorization
    const authorizationResponse = await plaidClient.transferAuthorizationCreate({
      access_token: account.plaidAccessToken,
      account_id: account.plaidAccountId,
      type: type as any,
      network: 'ach',
      amount: amount.toString(),
      ach_class: 'ppd',
      user: {
        legal_name: 'Test User', // In production, use real user data
      },
    })

    const authorization = authorizationResponse.data.authorization

    // If authorization is approved, create the transfer
    if (authorization.decision === 'approved') {
      const transferResponse = await plaidClient.transferCreate({
        access_token: account.plaidAccessToken,
        account_id: account.plaidAccountId,
        authorization_id: authorization.id,
        type: type as any,
        network: 'ach',
        amount: amount.toString(),
        description: description || `Transfer - ${new Date().toLocaleDateString()}`,
        ach_class: 'ppd',
        user: {
          legal_name: 'Test User',
        },
      })

      return NextResponse.json({
        success: true,
        transfer: transferResponse.data.transfer,
        authorization: authorization,
      })
    } else {
      return NextResponse.json({
        success: false,
        authorization: authorization,
        reason: authorization.decision_rationale?.description || 'Transfer not authorized',
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error creating transfer:', error)
    
    // Check if it's a Plaid error about Transfer product not being enabled
    if (error.response?.data?.error_code === 'PRODUCTS_NOT_SUPPORTED') {
      return NextResponse.json(
        { 
          error: 'Transfer product not enabled for this account. In production, you need to apply for Transfer access.',
          details: 'For sandbox testing, make sure to use accounts that support Transfer.',
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.response?.data?.error_message || 'Failed to create transfer',
        code: error.response?.data?.error_code,
      },
      { status: 500 }
    )
  }
}