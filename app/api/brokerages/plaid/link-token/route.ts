import { NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

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

export async function POST() {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: 'user-id', // In production, use actual user ID from session
      },
      client_name: 'Web1.0 Portfolio',
      products: [Products.Investments, Products.Accounts],
      country_codes: [CountryCode.Us],
      language: 'en',
    })

    return NextResponse.json({ linkToken: response.data.link_token })
  } catch (error) {
    console.error('Error creating Plaid link token:', error)
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    )
  }
}