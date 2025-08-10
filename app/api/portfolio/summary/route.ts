import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createPublicClient, http, formatEther } from 'viem'
import { mainnet } from 'viem/chains'
import type { PortfolioSummary, Position, Web3Wallet, BrokerageAccount } from '@/types/wallet'

const prisma = new PrismaClient()

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session (hardcoded for now)
    const userId = 'user-id'

    // Fetch Web3 wallets from request headers or session
    const walletAddress = request.headers.get('x-wallet-address')
    const web3Wallets: Web3Wallet[] = []
    
    if (walletAddress) {
      const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` })
      
      web3Wallets.push({
        address: walletAddress,
        chainId: 1,
        provider: 'metamask',
        balance: formatEther(balance),
        isConnected: true
      })
    }

    // Fetch brokerage connections from database
    const brokerageConnections = await prisma.brokerageConnection.findMany({
      where: { userId },
      include: { holdings: true }
    })

    const brokerageAccounts: BrokerageAccount[] = brokerageConnections.map(conn => ({
      id: conn.id,
      provider: conn.provider as any,
      accountName: conn.institutionName,
      accountType: 'cash',
      isConnected: true,
      lastSync: conn.updatedAt
    }))

    // Aggregate all positions
    const positions: Position[] = []

    // Add brokerage positions
    for (const connection of brokerageConnections) {
      for (const holding of connection.holdings) {
        const pnl = holding.currentValue - holding.costBasis
        const pnlPercent = (pnl / holding.costBasis) * 100

        positions.push({
          symbol: holding.symbol,
          name: holding.symbol, // In production, fetch full name from API
          quantity: holding.quantity,
          averageCost: holding.costBasis / holding.quantity,
          currentPrice: holding.currentValue / holding.quantity,
          value: holding.currentValue,
          pnl,
          pnlPercent,
          source: 'brokerage',
          sourceId: connection.id
        })
      }
    }

    // Add Web3 positions (ETH balance as example)
    if (walletAddress && web3Wallets[0]) {
      const ethPrice = 2500 // In production, fetch from price oracle
      const ethBalance = parseFloat(web3Wallets[0].balance || '0')
      const ethValue = ethBalance * ethPrice

      positions.push({
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: ethBalance,
        averageCost: 2000, // Example cost basis
        currentPrice: ethPrice,
        value: ethValue,
        pnl: ethValue - (ethBalance * 2000),
        pnlPercent: ((ethPrice - 2000) / 2000) * 100,
        source: 'web3',
        sourceId: walletAddress
      })
    }

    // Calculate totals
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0)
    const totalCost = positions.reduce((sum, p) => sum + (p.quantity * p.averageCost), 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

    const summary: PortfolioSummary = {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      positions,
      transactions: [], // Would fetch from database
      web3Wallets,
      brokerageAccounts
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching portfolio summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio summary' },
      { status: 500 }
    )
  }
}