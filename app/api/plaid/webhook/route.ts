import { NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

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
    const body = await request.json()
    const { webhook_type, webhook_code, item_id } = body

    console.log(`Received webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`)

    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhook_code, item_id, body)
        break
      case 'ITEM':
        await handleItemWebhook(webhook_code, item_id, body)
        break
      case 'ACCOUNTS':
        await handleAccountsWebhook(webhook_code, item_id, body)
        break
      default:
        console.log(`Unhandled webhook type: ${webhook_type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function handleTransactionsWebhook(code: string, itemId: string, body: any) {
  switch (code) {
    case 'INITIAL_UPDATE':
      console.log(`Initial transaction update available for item ${itemId}`)
      // Fetch new transactions
      await syncTransactions(itemId)
      break
    case 'HISTORICAL_UPDATE':
      console.log(`Historical transactions ready for item ${itemId}`)
      // Fetch historical transactions
      await syncTransactions(itemId)
      break
    case 'DEFAULT_UPDATE':
      console.log(`New transactions available for item ${itemId}`)
      // Fetch latest transactions
      await syncTransactions(itemId)
      break
    case 'TRANSACTIONS_REMOVED':
      const { removed_transactions } = body
      console.log(`Transactions removed: ${removed_transactions}`)
      // Remove transactions from database
      break
  }
}

async function handleItemWebhook(code: string, itemId: string, body: any) {
  switch (code) {
    case 'ERROR':
      const { error } = body
      console.error(`Item error for ${itemId}:`, error)
      // Handle item error (e.g., notify user to re-authenticate)
      break
    case 'PENDING_EXPIRATION':
      console.warn(`Item ${itemId} access token will expire soon`)
      // Notify user to re-authenticate
      break
    case 'USER_PERMISSION_REVOKED':
      console.log(`User revoked permission for item ${itemId}`)
      // Remove item from database
      break
    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      console.log(`Webhook URL updated for item ${itemId}`)
      break
  }
}

async function handleAccountsWebhook(code: string, itemId: string, body: any) {
  switch (code) {
    case 'ACCOUNT_ADDED':
      console.log(`New account added to item ${itemId}`)
      // Fetch updated accounts
      await syncAccounts(itemId)
      break
    case 'ACCOUNT_REMOVED':
      console.log(`Account removed from item ${itemId}`)
      // Update accounts in database
      await syncAccounts(itemId)
      break
    case 'BALANCE_UPDATE':
      console.log(`Balance update for item ${itemId}`)
      // Update account balances
      await syncAccounts(itemId)
      break
  }
}

async function syncTransactions(itemId: string) {
  // TODO: Implement transaction sync
  // 1. Get access_token from database using itemId
  // 2. Fetch transactions from Plaid
  // 3. Store/update transactions in database
  console.log(`Syncing transactions for item ${itemId}`)
}

async function syncAccounts(itemId: string) {
  // TODO: Implement account sync
  // 1. Get access_token from database using itemId
  // 2. Fetch accounts from Plaid
  // 3. Store/update accounts in database
  console.log(`Syncing accounts for item ${itemId}`)
}