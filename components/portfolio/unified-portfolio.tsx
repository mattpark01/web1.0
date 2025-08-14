"use client"

import { useEffect, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Superellipse } from '@/components/ui/superellipse/superellipse'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Clock,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatEther } from 'viem'
import { useWeb3Holdings } from '@/hooks/use-web3-holdings'
import { usePlaidInvestments } from '@/hooks/use-plaid-investments'
import type { Position, BrokerageAccount, Web3Wallet, PortfolioSummary } from '@/types/wallet'

export function UnifiedPortfolio() {
  const { address, isConnected } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default
  const [enableWebSocket, setEnableWebSocket] = useState(true)
  
  const { 
    tokenBalances, 
    totalValue: web3TotalValue, 
    loading: web3Loading,
    lastUpdated: web3LastUpdated,
    refresh: refreshWeb3,
    isLiveUpdating
  } = useWeb3Holdings(refreshInterval, enableWebSocket)
  
  const { investments, loading: investmentsLoading, refetch: refetchInvestments } = usePlaidInvestments()
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [showBalances, setShowBalances] = useState(true)
  const [selectedSource, setSelectedSource] = useState<'all' | 'web3' | 'brokerage'>('all')

  const fetchPortfolioData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/portfolio/summary')
      if (response.ok) {
        const data = await response.json()
        setPortfolio(data)
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolioData()
  }, [address, isConnected])

  const formatCurrency = (value: number) => {
    if (!showBalances) return '••••••'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // Combine Web3 token balances with brokerage positions
  const allPositions: Position[] = [
    // Add Web3 positions
    ...tokenBalances.map(token => ({
      symbol: token.symbol,
      name: token.name,
      quantity: parseFloat(token.balance),
      averageCost: token.price || 0, // Use current price as cost for now
      currentPrice: token.price || 0,
      value: token.value || 0,
      pnl: 0, // Would need historical data for real P&L
      pnlPercent: 0,
      source: 'web3' as const,
      sourceId: token.address,
      chainName: (token as any).chainName,
      chainId: (token as any).chainId
    })),
    // Add Plaid investment positions
    ...(investments?.holdings || []).map(holding => ({
      symbol: holding.symbol,
      name: holding.name,
      quantity: holding.quantity,
      averageCost: holding.cost_basis / (holding.quantity || 1),
      currentPrice: holding.price,
      value: holding.value,
      pnl: holding.gain_loss,
      pnlPercent: holding.gain_loss_percent,
      source: 'brokerage' as const,
      sourceId: holding.account_name
    })),
    // Add other brokerage positions from portfolio API
    ...(portfolio?.positions || []).filter(p => p.source === 'brokerage')
  ]

  const filteredPositions = allPositions.filter(position => {
    if (selectedSource === 'all') return true
    return position.source === selectedSource
  })

  const plaidInvestmentValue = investments?.total_value || 0
  const otherBrokerageValue = portfolio?.positions
    .filter(p => p.source === 'brokerage')
    .reduce((sum, p) => sum + p.value, 0) || 0
  const brokerageValue = plaidInvestmentValue + otherBrokerageValue

  const totalValue = web3TotalValue + brokerageValue
  const totalPnL = (investments?.holdings || []).reduce((sum, h) => sum + h.gain_loss, 0) + (portfolio?.totalPnL || 0)
  const totalPnLPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Superellipse cornerRadius={16} cornerSmoothing={1} className="bg-card">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardDescription>Total Portfolio Value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatCurrency(Math.abs(totalPnL))} ({formatPercent(totalPnLPercent)})
              </div>
            </CardContent>
          </Card>
        </Superellipse>

        <Superellipse cornerRadius={16} cornerSmoothing={1} className="bg-card">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center justify-between">
                <span>Web3 Assets</span>
                {enableWebSocket && (
                  <Badge variant="secondary" className="text-xs border-0">
                    <Activity className="h-2 w-2 mr-1" />
                    Live
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalances ? formatCurrency(web3TotalValue) : '••••••'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {tokenBalances.length} tokens • {isConnected ? '1 wallet' : 'No wallet'}
              </div>
            </CardContent>
          </Card>
        </Superellipse>

        <Superellipse cornerRadius={16} cornerSmoothing={1} className="bg-card">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardDescription>Brokerage Accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalances ? formatCurrency(brokerageValue) : '••••••'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {(investments?.accounts?.length || 0) + (portfolio?.brokerageAccounts?.length || 0)} accounts linked
              </div>
            </CardContent>
          </Card>
        </Superellipse>

        <Superellipse cornerRadius={16} cornerSmoothing={1} className="bg-card">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardDescription>Today's Performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(2847)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                +2.3% from yesterday
              </div>
            </CardContent>
          </Card>
        </Superellipse>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Tabs value={selectedSource} onValueChange={(v) => setSelectedSource(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All Assets</TabsTrigger>
            <TabsTrigger value="web3">Web3 Only</TabsTrigger>
            <TabsTrigger value="brokerage">Brokerage Only</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {/* Live status indicator */}
          {isLiveUpdating && (
            <Badge variant="secondary" className="animate-pulse border-0">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
          
          {/* Last updated timestamp */}
          {web3LastUpdated && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(web3LastUpdated).toLocaleTimeString()}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          
          {/* Settings dropdown for refresh interval */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Auto-refresh Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRefreshInterval(0)}>
                <span className={refreshInterval === 0 ? 'font-semibold' : ''}>Disabled</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(10000)}>
                <span className={refreshInterval === 10000 ? 'font-semibold' : ''}>Every 10 seconds</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(30000)}>
                <span className={refreshInterval === 30000 ? 'font-semibold' : ''}>Every 30 seconds</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(60000)}>
                <span className={refreshInterval === 60000 ? 'font-semibold' : ''}>Every minute</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshInterval(300000)}>
                <span className={refreshInterval === 300000 ? 'font-semibold' : ''}>Every 5 minutes</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEnableWebSocket(!enableWebSocket)}>
                <span className="flex items-center justify-between w-full">
                  Real-time updates
                  <Badge variant={enableWebSocket ? "default" : "secondary"} className="ml-2 border-0">
                    {enableWebSocket ? 'ON' : 'OFF'}
                  </Badge>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none"
            onClick={() => {
              fetchPortfolioData()
              refetchInvestments()
              refreshWeb3()
            }}
            disabled={loading || web3Loading || investmentsLoading || isLiveUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || web3Loading || investmentsLoading || isLiveUpdating) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Holdings Table */}
      <Superellipse cornerRadius={16} cornerSmoothing={1} className="bg-card">
        <Card className="border-0">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>
              Your unified portfolio across all connected accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-2">
            {(loading || web3Loading || investmentsLoading) && filteredPositions.length === 0 ? (
              // Show skeleton loaders while loading
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <Superellipse cornerRadius={8} cornerSmoothing={1} className="w-10 h-10">
                        <Skeleton className="w-full h-full" />
                      </Superellipse>
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </>
            ) : filteredPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No holdings found. Connect a wallet or brokerage to get started.
              </div>
            ) : (
              filteredPositions.map((position, index) => (
              <Superellipse
                key={`${position.source}-${position.symbol}-${index}`}
                cornerRadius={8}
                cornerSmoothing={1}
                className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-300 ${
                  position.source === 'web3' && isLiveUpdating ? 'bg-primary/5 animate-pulse' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <Superellipse cornerRadius={8} cornerSmoothing={1} className="w-10 h-10 bg-primary/10 flex items-center justify-center relative">
                    <span className="text-xs font-semibold">
                      {position.symbol.slice(0, 4).toUpperCase()}
                    </span>
                  </Superellipse>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{position.name}</p>
                      <Badge variant="secondary" className="text-xs border-0">
                        {position.source === 'web3' ? (
                          <>
                            <Wallet className="h-3 w-3 mr-1" /> 
                            {(position as any).chainName || 'Web3'}
                          </>
                        ) : (
                          <><Building2 className="h-3 w-3 mr-1" /> Brokerage</>
                        )}
                      </Badge>
                      {position.source === 'web3' && isLiveUpdating && (
                        <Badge variant="secondary" className="text-xs animate-pulse">
                          <Activity className="h-2 w-2 mr-1" />
                          Updating
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {position.source === 'web3' 
                        ? `${position.quantity < 0.000001 ? position.quantity.toExponential(2) : position.quantity.toFixed(6)} ${position.symbol}`
                        : `${position.quantity} shares @ ${formatCurrency(position.averageCost)}`}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium flex items-center justify-end gap-1">
                    {formatCurrency(position.value)}
                    {position.source === 'web3' && isLiveUpdating && (
                      <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </p>
                  <p className={`text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(position.pnl))} ({formatPercent(position.pnlPercent)})
                  </p>
                </div>
              </Superellipse>
            )))}
          </div>
        </CardContent>
        </Card>
      </Superellipse>

      {/* Asset Allocation */}
      <Superellipse cornerRadius={16} cornerSmoothing={1} className="bg-card">
        <Card className="border-0">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>
              Distribution across different asset sources
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Web3 Assets</span>
                <span className="text-sm text-muted-foreground">
                  {totalValue > 0 ? `${((web3TotalValue / totalValue) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <Progress value={totalValue > 0 ? (web3TotalValue / totalValue) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Traditional Brokerages</span>
                <span className="text-sm text-muted-foreground">
                  {totalValue > 0 ? `${((brokerageValue / totalValue) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <Progress value={totalValue > 0 ? (brokerageValue / totalValue) * 100 : 0} className="h-2" />
            </div>
          </div>
        </CardContent>
        </Card>
      </Superellipse>
    </div>
  )
}