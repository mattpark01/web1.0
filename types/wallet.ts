export interface WalletProvider {
  id: string
  name: string
  icon: string
  type: 'web3' | 'brokerage'
}

export interface Web3Wallet {
  address: string
  chainId: number
  provider: string
  balance?: string
  isConnected: boolean
}

export interface BrokerageAccount {
  id: string
  provider: 'plaid' | 'alpaca' | 'tradier' | 'interactive_brokers' | 'td_ameritrade'
  accountName: string
  accountType: 'cash' | 'margin' | 'retirement'
  isConnected: boolean
  lastSync?: Date
}

export interface Position {
  symbol: string
  name: string
  quantity: number
  averageCost: number
  currentPrice: number
  value: number
  pnl: number
  pnlPercent: number
  source: 'web3' | 'brokerage'
  sourceId: string
}

export interface Transaction {
  id: string
  type: 'buy' | 'sell' | 'transfer' | 'deposit' | 'withdrawal'
  symbol?: string
  quantity?: number
  price?: number
  amount: number
  timestamp: Date
  source: 'web3' | 'brokerage'
  sourceId: string
  txHash?: string
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercent: number
  positions: Position[]
  transactions: Transaction[]
  web3Wallets: Web3Wallet[]
  brokerageAccounts: BrokerageAccount[]
}