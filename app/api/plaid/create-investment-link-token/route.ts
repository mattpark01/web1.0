import { NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid'

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
    const { userId } = await request.json()

    const linkTokenParams: any = {
      client_name: 'Spatio Portfolio',
      country_codes: [CountryCode.Us],
      language: 'en',
      user: {
        client_user_id: userId || 'default-user',
      },
      // Request investment-specific products
      products: [Products.Investments, Products.Accounts, Products.Holdings],
      // Optional: Add investment-specific account filters
      account_filters: {
        investment: {
          account_subtypes: ['brokerage', '401k', 'ira', 'roth', '403b', '457b', '529']
        }
      }
    }

    // Only add webhook if it exists and is not empty
    if (process.env.PLAID_WEBHOOK_URL && process.env.PLAID_WEBHOOK_URL.trim() !== '') {
      linkTokenParams.webhook = process.env.PLAID_WEBHOOK_URL
    }

    const response = await plaidClient.linkTokenCreate(linkTokenParams)

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (error: any) {
    console.error('Error creating investment link token:', error)
    const errorMessage = error.response?.data?.error_message || error.message || 'Failed to create link token'
    const errorCode = error.response?.data?.error_code || 'UNKNOWN_ERROR'
    return NextResponse.json(
      { 
        error: errorMessage,
        error_code: errorCode,
        details: error.response?.data || {}
      },
      { status: 500 }
    )
  }
}