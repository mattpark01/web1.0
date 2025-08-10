import { NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode } from 'plaid'

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
      client_name: 'Spatio Bank',
      country_codes: [CountryCode.Us],
      language: 'en',
      user: {
        client_user_id: userId || 'default-user',
      },
      products: ['auth', 'transactions', 'transfer'],
    }

    // Only add redirect_uri if it exists (commented out for now - needs to be configured in Plaid dashboard first)
    // if (process.env.PLAID_REDIRECT_URI) {
    //   linkTokenParams.redirect_uri = process.env.PLAID_REDIRECT_URI
    // }

    // Only add webhook if it exists and is not empty
    if (process.env.PLAID_WEBHOOK_URL && process.env.PLAID_WEBHOOK_URL.trim() !== '') {
      linkTokenParams.webhook = process.env.PLAID_WEBHOOK_URL
    }

    const response = await plaidClient.linkTokenCreate(linkTokenParams)

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (error: any) {
    console.error('Error creating link token:', error)
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