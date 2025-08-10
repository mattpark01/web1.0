import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    // For now, use a default user ID - you should get this from session
    const userId = 'default-user' // Replace with actual user authentication

    // Fetch accounts from database
    const accounts = await prisma.bankAccount.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform to Plaid-like format for compatibility with existing frontend
    const formattedAccounts = accounts.map(account => ({
      account_id: account.plaidAccountId,
      balances: {
        available: account.availableBalance?.toNumber() || null,
        current: account.currentBalance?.toNumber() || 0,
        iso_currency_code: account.currency,
        limit: account.creditLimit?.toNumber() || null,
        unofficial_currency_code: null,
      },
      mask: account.mask,
      name: account.name,
      official_name: account.officialName,
      type: account.type,
      subtype: account.subtype,
    }))

    return NextResponse.json({ accounts: formattedAccounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}