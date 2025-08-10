import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    // For now, use a default user ID - you should get this from session
    const userId = 'default-user' // Replace with actual user authentication

    // First get user's accounts
    const accounts = await prisma.bankAccount.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        plaidAccountId: true,
      },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

    // Fetch transactions from database
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: {
          in: accounts.map(a => a.id),
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 100, // Limit to last 100 transactions
    })

    // Transform to Plaid-like format for compatibility with existing frontend
    const formattedTransactions = transactions.map(transaction => ({
      account_id: transaction.account.plaidAccountId,
      amount: transaction.amount.toNumber(),
      iso_currency_code: transaction.account.currency,
      unofficial_currency_code: null,
      category: transaction.category,
      category_id: null,
      date: transaction.date.toISOString().split('T')[0],
      datetime: transaction.date.toISOString(),
      location: {
        address: null,
        city: null,
        country: null,
        lat: null,
        lon: null,
        postal_code: null,
        region: null,
        store_number: null,
      },
      merchant_name: transaction.merchantName,
      name: transaction.name,
      payment_channel: 'online',
      pending: transaction.pending,
      pending_transaction_id: null,
      transaction_id: transaction.plaidTransactionId,
      transaction_type: 'special',
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}