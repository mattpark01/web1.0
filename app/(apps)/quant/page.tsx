"use client"

import React, { useState, useEffect } from "react"
import { 
  Activity, 
  TrendingUp, 
  BarChart3, 
  DollarSign,
  LineChart as LineChartIcon,
  Settings,
  PlayCircle,
  Target,
  Database,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Info,
  PieChart as PieChartIcon,
  TrendingDown,
  Shield,
  Zap,
  Wallet,
  Eye,
  EyeOff,
  Server
} from "lucide-react"
import { useAccount, useBalance } from 'wagmi'
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button'
import { useWeb3Holdings } from '@/hooks/use-web3-holdings'
import { ServerConnection } from '@/components/quant/server-connection'
import { useServerConnections } from '@/hooks/use-server-connections'
import { Badge } from '@/components/ui/badge'
import { formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Superellipse } from "@/components/ui/superellipse/superellipse"

// Generate mock data for charts
const generatePerformanceData = () => {
  const data = []
  const now = new Date()
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolio: Math.floor(1000000 + Math.random() * 200000 + i * 5000),
      benchmark: Math.floor(1000000 + Math.random() * 100000 + i * 3000),
      alpha: Math.floor(Math.random() * 50000 - 10000)
    })
  }
  return data
}

const generateIntradayData = () => {
  const data = []
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      value: 100 + Math.random() * 20 - 10 + i * 0.5,
      volume: Math.floor(Math.random() * 1000000)
    })
  }
  return data
}

const portfolioAllocation = [
  { name: "Equities", value: 45, color: "#3b82f6" }, // blue
  { name: "Fixed Income", value: 25, color: "#10b981" }, // green
  { name: "Commodities", value: 15, color: "#f59e0b" }, // amber
  { name: "Crypto", value: 10, color: "#8b5cf6" }, // purple
  { name: "Cash", value: 5, color: "#6b7280" }, // gray
]

const riskMetrics = [
  { metric: "Sharpe Ratio", value: 85, fullMark: 100 },
  { metric: "Max Drawdown", value: 25, fullMark: 100 },
  { metric: "Win Rate", value: 67, fullMark: 100 },
  { metric: "Profit Factor", value: 72, fullMark: 100 },
  { metric: "Risk/Reward", value: 80, fullMark: 100 },
]

export default function QuantPage() {
  const [performanceData, setPerformanceData] = useState(generatePerformanceData())
  const [intradayData, setIntradayData] = useState(generateIntradayData())
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M")
  const [isLiveTrading, setIsLiveTrading] = useState(true)
  const [showBalances, setShowBalances] = useState(true)
  
  // Web3 hooks
  const { address, isConnected } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const { 
    tokenBalances, 
    totalValue: web3TotalValue, 
    loading: web3Loading,
    lastUpdated: web3LastUpdated,
    refresh: refreshWeb3,
    isLiveUpdating
  } = useWeb3Holdings(30000, true)
  
  // Server connections hook
  const {
    servers,
    addServer,
    removeServer,
    updateServer,
    connectServer,
    disconnectServer,
  } = useServerConnections()

  // Simulate real-time updates
  useEffect(() => {
    if (!isLiveTrading) return
    
    const interval = setInterval(() => {
      setIntradayData(prev => {
        const newData = [...prev]
        const lastValue = newData[newData.length - 1].value
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: lastValue + (Math.random() * 4 - 2),
          volume: Math.floor(Math.random() * 1000000)
        })
        return newData.slice(-24)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [isLiveTrading])

  const statsData = [
    {
      icon: Activity,
      label: "Active",
      value: "12",
      description: "Strategies Running",
      change: "+2",
    },
    {
      icon: TrendingUp,
      label: "Today",
      value: "+$12,847",
      description: "P&L (+4.3%)",
      change: "+2.1%",
      isPositive: true,
    },
    {
      icon: Shield,
      label: "Risk Score",
      value: "Low",
      description: "VaR: $45,230",
      change: "-12%",
    },
    {
      icon: Zap,
      label: "Signals",
      value: "247",
      description: "Last 24 hours",
      change: "+18",
    },
  ]

  const strategies = [
    {
      name: "Mean Reversion Alpha",
      status: "running",
      allocation: "$245K",
      return24h: 12.4,
      returnMtd: 28.7,
      winRate: 72,
      trades: 143,
      risk: "low"
    },
    {
      name: "Momentum Breakout",
      status: "running",
      allocation: "$180K",
      return24h: 8.7,
      returnMtd: 19.2,
      winRate: 65,
      trades: 89,
      risk: "medium"
    },
    {
      name: "Pairs Trading",
      status: "paused",
      allocation: "$120K",
      return24h: -2.1,
      returnMtd: 5.3,
      winRate: 58,
      trades: 67,
      risk: "low"
    },
    {
      name: "Statistical Arbitrage",
      status: "running",
      allocation: "$95K",
      return24h: 5.3,
      returnMtd: 15.8,
      winRate: 69,
      trades: 234,
      risk: "high"
    },
    {
      name: "Options Delta Neutral",
      status: "running",
      allocation: "$150K",
      return24h: 3.2,
      returnMtd: 11.4,
      winRate: 61,
      trades: 56,
      risk: "medium"
    },
  ]

  const recentSignals = [
    { ticker: "AAPL", action: "BUY", strategy: "Mean Reversion", price: "$156.42", time: "2m", confidence: 92 },
    { ticker: "TSLA", action: "SELL", strategy: "Momentum", price: "$243.18", time: "5m", confidence: 87 },
    { ticker: "SPY", action: "HOLD", strategy: "Pairs Trading", price: "$412.89", time: "12m", confidence: 75 },
    { ticker: "MSFT", action: "BUY", strategy: "Statistical Arb", price: "$378.25", time: "15m", confidence: 89 },
    { ticker: "NVDA", action: "BUY", strategy: "Breakout", price: "$521.30", time: "18m", confidence: 94 },
  ]

  const activeTrades = [
    { 
      id: "T-001",
      ticker: "AAPL", 
      side: "LONG", 
      entryPrice: 154.32, 
      currentPrice: 156.42, 
      quantity: 100,
      value: 15642,
      pnl: 210,
      pnlPercent: 1.36,
      leverage: 1.0,
      collateral: 15432,
      netInvested: 15432,
      stopLoss: 152.00,
      takeProfit: 160.00,
      duration: "2h 15m",
      strategy: "Mean Reversion"
    },
    { 
      id: "T-002",
      ticker: "TSLA", 
      side: "SHORT", 
      entryPrice: 245.80, 
      currentPrice: 243.18, 
      quantity: 50,
      value: 12159,
      pnl: 131,
      pnlPercent: 1.07,
      leverage: 2.0,
      collateral: 6150,
      netInvested: 6150,
      stopLoss: 248.00,
      takeProfit: 240.00,
      duration: "45m",
      strategy: "Momentum"
    },
    { 
      id: "T-003",
      ticker: "ETH/USD", 
      side: "LONG", 
      entryPrice: 2485.50, 
      currentPrice: 2523.75, 
      quantity: 5.5,
      value: 13880.63,
      pnl: 210.38,
      pnlPercent: 1.54,
      leverage: 5.0,
      collateral: 2740.25,
      netInvested: 2740.25,
      stopLoss: 2450.00,
      takeProfit: 2600.00,
      duration: "1h 30m",
      strategy: "Breakout"
    },
    { 
      id: "T-004",
      ticker: "SPY", 
      side: "LONG", 
      entryPrice: 411.25, 
      currentPrice: 412.89, 
      quantity: 75,
      value: 30966.75,
      pnl: 123,
      pnlPercent: 0.40,
      leverage: 1.0,
      collateral: 30843.75,
      netInvested: 30843.75,
      stopLoss: 409.00,
      takeProfit: 415.00,
      duration: "3h 45m",
      strategy: "Pairs Trading"
    },
    { 
      id: "T-005",
      ticker: "BTC/USD", 
      side: "LONG", 
      entryPrice: 43250.00, 
      currentPrice: 43521.00, 
      quantity: 0.25,
      value: 10880.25,
      pnl: 67.75,
      pnlPercent: 0.63,
      leverage: 10.0,
      collateral: 1081.25,
      netInvested: 1081.25,
      stopLoss: 42500.00,
      takeProfit: 45000.00,
      duration: "5h 20m",
      strategy: "Statistical Arb"
    },
    { 
      id: "T-006",
      ticker: "NVDA", 
      side: "LONG", 
      entryPrice: 518.75, 
      currentPrice: 521.30, 
      quantity: 30,
      value: 15639,
      pnl: 76.50,
      pnlPercent: 0.49,
      leverage: 3.0,
      collateral: 5187.50,
      netInvested: 5187.50,
      stopLoss: 515.00,
      takeProfit: 530.00,
      duration: "25m",
      strategy: "Breakout"
    }
  ]

  const marketOverview = [
    { name: "S&P 500", value: 4521.23, change: 1.2, isPositive: true },
    { name: "NASDAQ", value: 14238.91, change: 1.8, isPositive: true },
    { name: "DJI", value: 35981.45, change: 0.9, isPositive: true },
    { name: "VIX", value: 18.23, change: -5.2, isPositive: false },
    { name: "Gold", value: 2043.50, change: 0.3, isPositive: true },
    { name: "BTC", value: 43521.00, change: 3.4, isPositive: true },
  ]

  const getCardBorderClasses = (index: number, totalCards: number) => {
    if (index === 0) return ""
    const borderClasses = ["border-l", "border-border"]
    if (index === 2) {
      borderClasses.push("lg:border-l")
    } else if (index % 2 === 0) {
      borderClasses.push("sm:border-l")
    }
    return borderClasses.join(" ")
  }

  const chartConfig = {
    portfolio: {
      label: "Portfolio",
      color: "hsl(var(--foreground))",
    },
    benchmark: {
      label: "Benchmark",
      color: "hsl(var(--muted-foreground))",
    },
  }

  const intradayConfig = {
    value: {
      label: "Price",
      color: "hsl(var(--foreground))",
    },
  }

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="p-8 space-y-6">
          
          {/* Header with Web3 Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">
                    {showBalances 
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(web3TotalValue)
                      : '••••••'}
                  </h1>
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Web3 Portfolio • {tokenBalances.length} tokens
                  </p>
                  {isConnected && isLiveUpdating && (
                    <Badge variant="secondary" className="text-xs animate-pulse border-0">
                      <Activity className="h-2 w-2 mr-1" />
                      Live
                    </Badge>
                  )}
                  {web3LastUpdated && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(web3LastUpdated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              {!isConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">No wallet connected</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <WalletConnectButton />
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isLiveTrading ? 'bg-foreground animate-pulse' : 'bg-muted-foreground'}`} />
                <span className="text-sm font-medium">{isLiveTrading ? 'Live Trading' : 'Markets Closed'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {selectedTimeframe}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("TICK")}>
                    <span className={selectedTimeframe === "TICK" ? 'font-semibold' : ''}>Tick</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1S")}>
                    <span className={selectedTimeframe === "1S" ? 'font-semibold' : ''}>1 Second</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("5S")}>
                    <span className={selectedTimeframe === "5S" ? 'font-semibold' : ''}>5 Seconds</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("10S")}>
                    <span className={selectedTimeframe === "10S" ? 'font-semibold' : ''}>10 Seconds</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("30S")}>
                    <span className={selectedTimeframe === "30S" ? 'font-semibold' : ''}>30 Seconds</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1m")}>
                    <span className={selectedTimeframe === "1m" ? 'font-semibold' : ''}>1 Minute</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("5m")}>
                    <span className={selectedTimeframe === "5m" ? 'font-semibold' : ''}>5 Minutes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("15m")}>
                    <span className={selectedTimeframe === "15m" ? 'font-semibold' : ''}>15 Minutes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("30m")}>
                    <span className={selectedTimeframe === "30m" ? 'font-semibold' : ''}>30 Minutes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1H")}>
                    <span className={selectedTimeframe === "1H" ? 'font-semibold' : ''}>1 Hour</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("4H")}>
                    <span className={selectedTimeframe === "4H" ? 'font-semibold' : ''}>4 Hours</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1D")}>
                    <span className={selectedTimeframe === "1D" ? 'font-semibold' : ''}>1 Day</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1W")}>
                    <span className={selectedTimeframe === "1W" ? 'font-semibold' : ''}>1 Week</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1M")}>
                    <span className={selectedTimeframe === "1M" ? 'font-semibold' : ''}>1 Month</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("3M")}>
                    <span className={selectedTimeframe === "3M" ? 'font-semibold' : ''}>3 Months</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTimeframe("1Y")}>
                    <span className={selectedTimeframe === "1Y" ? 'font-semibold' : ''}>1 Year</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Server Connections Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">Trading Servers</h2>
                  <p className="text-sm text-muted-foreground">
                    {servers.filter(s => s.status === 'connected').length} of {servers.length} connected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {servers.reduce((sum, s) => sum + (s.activeTrades || 0), 0)} Active Trades
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {servers.reduce((sum, s) => sum + (s.strategies || 0), 0)} Strategies
                </Badge>
              </div>
            </div>
            
            <ServerConnection
              servers={servers}
              onAddServer={addServer}
              onRemoveServer={removeServer}
              onUpdateServer={updateServer}
              onConnect={connectServer}
              onDisconnect={disconnectServer}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className={`p-6 ${getCardBorderClasses(index, statsData.length)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded bg-foreground/5`}>
                      <Icon className={`h-4 w-4`} />
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className={`text-2xl font-bold ${stat.isPositive ? '' : ''}`}>{stat.value}</div>
                    {stat.change && (
                      <span className={`text-xs text-muted-foreground`}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                </div>
              )
            })}
          </div>

          {/* Market Overview Ticker */}
          <div className="border-t border-b border-border py-3">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-medium text-muted-foreground shrink-0">MARKETS</span>
              {marketOverview.map((market) => (
                <div key={market.name} className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">{market.name}</span>
                  <span className="text-sm text-muted-foreground">{market.value.toLocaleString()}</span>
                  <span className={`text-xs flex items-center ${market.isPositive ? '' : ''}`}>
                    {market.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(market.change)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Portfolio Performance Chart */}
            <Superellipse className="lg:col-span-2 bg-white/[0.025] dark:bg-white/[0.025]" cornerRadius={12}>
              <div className="flex flex-col h-full">
                <div className="p-6 pb-3">
                  <h3 className="text-lg font-semibold">Portfolio Performance</h3>
                  <p className="text-sm text-muted-foreground">Portfolio vs Benchmark comparison</p>
                </div>
                <div className="p-6 pt-3 flex-1">
                  <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
                  <LineChart data={performanceData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      className="text-muted-foreground"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ className: "stroke-border" }}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ className: "stroke-border" }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="portfolio"
                      className="stroke-foreground"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      className="stroke-muted-foreground"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
                </div>
              </div>
            </Superellipse>

            {/* Portfolio Allocation */}
            <Superellipse className="bg-white/[0.025] dark:bg-white/[0.025] h-full" cornerRadius={12}>
              <div className="flex flex-col h-full">
                <div className="p-6 pb-3">
                  <h3 className="text-lg font-semibold">Portfolio Allocation</h3>
                  <p className="text-sm text-muted-foreground">Asset distribution</p>
                </div>
                <div className="p-6 pt-3 flex-1 flex flex-col">
                  <ChartContainer config={{}} className="flex-1 w-full">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={portfolioAllocation}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {portfolioAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded p-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ChartContainer>
                  <div className="mt-4 space-y-2">
                  {portfolioAllocation.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </Superellipse>
          </div>

          {/* Strategies Table */}
          <Superellipse className="bg-white/[0.025] dark:bg-white/[0.025]" cornerRadius={12}>
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Active Strategies</h3>
                  <p className="text-sm text-muted-foreground">Detailed performance metrics</p>
                </div>
                <button className="text-sm hover:underline">Manage Strategies</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4 font-medium">Strategy</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Allocation</th>
                    <th className="text-right p-4 font-medium">Active</th>
                    <th className="text-right p-4 font-medium">24h Return</th>
                    <th className="text-right p-4 font-medium">MTD Return</th>
                    <th className="text-right p-4 font-medium">Win Rate</th>
                    <th className="text-right p-4 font-medium">Total Trades</th>
                    <th className="text-right p-4 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {strategies.map((strategy, index) => (
                    <tr key={strategy.name} className={`${index < strategies.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors`}>
                      <td className="p-4 font-medium">{strategy.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            strategy.status === 'running' ? 'bg-foreground' : 'bg-muted-foreground'
                          }`} />
                          <span className="text-xs capitalize">{strategy.status}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-muted-foreground">{strategy.allocation}</td>
                      <td className="p-4 text-right font-medium">
                        {activeTrades.filter(trade => trade.strategy === strategy.name).length}
                      </td>
                      <td className={`p-4 text-right font-medium`}>
                        {strategy.return24h > 0 ? '+' : ''}{strategy.return24h}%
                      </td>
                      <td className={`p-4 text-right font-medium`}>
                        {strategy.returnMtd > 0 ? '+' : ''}{strategy.returnMtd}%
                      </td>
                      <td className="p-4 text-right text-muted-foreground">{strategy.winRate}%</td>
                      <td className="p-4 text-right text-muted-foreground">{strategy.trades}</td>
                      <td className="p-4 text-right">
                        <span className={`text-xs px-2 py-1 rounded border ${
                          strategy.risk === 'low' ? 'border-border bg-background' :
                          strategy.risk === 'medium' ? 'border-border bg-muted/50' :
                          'border-border bg-foreground/5'
                        }`}>
                          {strategy.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Superellipse>

          {/* Active Trades Table */}
          <Superellipse className="bg-white/[0.025] dark:bg-white/[0.025]" cornerRadius={12}>
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Active Trades</h3>
                  <p className="text-xs text-muted-foreground">Currently open positions across all strategies</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Total P&L: </span>
                    <span className="font-semibold font-mono">
                      +${activeTrades.reduce((sum, trade) => sum + trade.pnl, 0).toFixed(2)}
                    </span>
                  </div>
                  <button className="text-xs hover:underline">Close All</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border text-[10px] text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Symbol</th>
                    <th className="text-left p-3 font-medium">Side</th>
                    <th className="text-right p-3 font-medium">Lvg</th>
                    <th className="text-right p-3 font-medium">Margin</th>
                    <th className="text-right p-3 font-medium">Position</th>
                    <th className="text-right p-3 font-medium">Entry</th>
                    <th className="text-right p-3 font-medium">Current</th>
                    <th className="text-right p-3 font-medium">P&L</th>
                    <th className="text-right p-3 font-medium">Stop</th>
                    <th className="text-right p-3 font-medium">Target</th>
                    <th className="text-right p-3 font-medium">Duration</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map((trade, index) => (
                    <tr key={trade.id} className={`${index < activeTrades.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors`}>
                      <td className="p-3 text-[10px] font-mono">{trade.id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs">{trade.ticker}</span>
                          <Badge variant="secondary" className="text-[10px] border-0">
                            {trade.strategy}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted/50`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-xs font-semibold">{trade.leverage}x</td>
                      <td className="p-3 text-right text-muted-foreground font-mono text-xs">${trade.collateral.toLocaleString()}</td>
                      <td className="p-3 text-right font-medium font-mono text-xs">${trade.value.toLocaleString()}</td>
                      <td className="p-3 text-right text-muted-foreground font-mono text-xs">${trade.entryPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium font-mono text-xs">${trade.currentPrice.toFixed(2)}</td>
                      <td className={`p-3 text-right font-medium font-mono text-xs`}>
                        <div className="flex flex-col items-end">
                          <span>{trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}</span>
                          <span className="text-[10px]">({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs font-mono">${trade.stopLoss.toFixed(2)}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs font-mono">${trade.takeProfit.toFixed(2)}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{trade.duration}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button className="text-[10px] px-1.5 py-0.5 hover:bg-muted rounded transition-colors">
                            Modify
                          </button>
                          <button className="text-[10px] px-1.5 py-0.5 hover:bg-muted rounded transition-colors">
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border">
                  <tr className="bg-muted/20">
                    <td colSpan={3} className="p-3 font-normal text-xs">Total</td>
                    <td className="p-3 text-right font-normal text-xs"></td>
                    <td className="p-3 text-right font-normal font-mono text-xs">
                      ${activeTrades.reduce((sum, trade) => sum + trade.collateral, 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-normal font-mono text-xs">
                      ${activeTrades.reduce((sum, trade) => sum + trade.value, 0).toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                    <td className="p-3 text-right font-normal font-mono text-xs">
                      +${activeTrades.reduce((sum, trade) => sum + trade.pnl, 0).toFixed(2)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Superellipse>

          {/* Bottom Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Intraday Performance */}
            <Superellipse className="lg:col-span-2 bg-white/[0.025] dark:bg-white/[0.025]" cornerRadius={12}>
              <div className="p-6 pb-3">
                <h3 className="text-lg font-semibold">Intraday Performance</h3>
                <p className="text-sm text-muted-foreground">Live price action</p>
              </div>
              <div className="p-6 pt-3">
                <ChartContainer config={intradayConfig} className="h-[280px] w-full">
                  <LineChart data={intradayData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      className="text-muted-foreground"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ className: "stroke-border" }}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ className: "stroke-border" }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      className="stroke-foreground"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, className: "fill-foreground stroke-background stroke-2" }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </Superellipse>

            {/* Risk Metrics Radar */}
            <Superellipse className="bg-white/[0.025] dark:bg-white/[0.025]" cornerRadius={12}>
              <div className="p-6 pb-3">
                <h3 className="text-lg font-semibold">Risk Metrics</h3>
                <p className="text-sm text-muted-foreground">Portfolio risk analysis</p>
              </div>
              <div className="p-6 pt-3">
                <ChartContainer config={{}} className="h-[280px] w-full">
                  <RadarChart data={riskMetrics} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid 
                      stroke="#ffffff" 
                      strokeOpacity={0.3}
                      strokeDasharray="3 3"
                    />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: '#ffffff', fontSize: 12 }}
                      stroke="#ffffff"
                      strokeOpacity={0.5}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: '#ffffff', fontSize: 10, opacity: 0.8 }}
                      stroke="#ffffff"
                      strokeOpacity={0.3}
                    />
                    <Radar
                      name="Current"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                      strokeWidth={3}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded p-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].payload.metric}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </RadarChart>
                </ChartContainer>
              </div>
            </Superellipse>
          </div>

          {/* Recent Signals */}
          <Superellipse className="bg-white/[0.025] dark:bg-white/[0.025]" cornerRadius={12}>
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Recent Trading Signals</h3>
                  <p className="text-sm text-muted-foreground">Latest algorithmic recommendations</p>
                </div>
                <button className="text-sm hover:underline">View All</button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentSignals.map((signal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${
                        signal.action === 'BUY' ? 'border-border bg-foreground text-background' :
                        signal.action === 'SELL' ? 'border-border bg-background' :
                        'border-border bg-muted/50'
                      }`}>
                        {signal.action}
                      </div>
                      <div>
                        <div className="font-medium">{signal.ticker}</div>
                        <div className="text-xs text-muted-foreground">{signal.strategy} • {signal.price}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{signal.confidence}%</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {signal.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Superellipse>

        </div>
      </div>
    </div>
  )
}