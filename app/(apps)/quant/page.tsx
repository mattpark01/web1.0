"use client"

import { 
  Activity, 
  TrendingUp, 
  BarChart3, 
  DollarSign,
  LineChart,
  Settings,
  PlayCircle,
  Target,
  Database,
  AlertTriangle
} from "lucide-react"
// import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar"

export default function QuantPage() {
  const statsData = [
    {
      icon: Activity,
      label: "Active",
      value: "12",
      description: "Strategies Running",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "Today",
      value: "+$2,847",
      description: "P&L (+2.3%)",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
    {
      icon: BarChart3,
      label: "Win Rate",
      value: "67.4%",
      description: "Last 30 days",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600",
    },
    {
      icon: DollarSign,
      label: "Capital",
      value: "$1.2M",
      description: "Assets Under Management",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600",
    },
  ]

  const getCardBorderClasses = (index: number, totalCards: number) => {
    // No border on the first card (index 0)
    if (index === 0) return ""
    
    // For responsive grid: 1 col on mobile, 2 cols on sm, 4 cols on lg
    const borderClasses = []
    
    // Always add left border for non-first cards
    borderClasses.push("border-l", "border-border")
    
    // Remove left border when card becomes first in row on smaller screens
    if (index === 2) {
      // Third card (index 2) becomes first on lg screens, so no left border on lg+
      borderClasses.push("lg:border-l")
    } else if (index % 2 === 0) {
      // Even indexed cards (except 0 and 2) become first on sm screens
      borderClasses.push("sm:border-l")
    }
    
    return borderClasses.join(" ")
  }

  // const sidebarItems: AppSidebarItem[] = [
  //   {
  //     id: "dashboard",
  //     label: "Dashboard",
  //     icon: BarChart3,
  //     isActive: true,
  //   },
  //   {
  //     id: "strategies",
  //     label: "Strategies", 
  //     icon: Target,
  //     count: 12,
  //   },
  //   {
  //     id: "backtesting",
  //     label: "Backtesting",
  //     icon: LineChart,
  //   },
  //   {
  //     id: "live-trading",
  //     label: "Live Trading",
  //     icon: PlayCircle,
  //   },
  //   {
  //     id: "market-data",
  //     label: "Market Data",
  //     icon: Database,
  //   },
  //   {
  //     id: "risk-analysis",
  //     label: "Risk Analysis", 
  //     icon: AlertTriangle,
  //   },
  //   {
  //     id: "settings",
  //     label: "Settings",
  //     icon: Settings,
  //   },
  // ]

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      {/* <AppSidebar items={sidebarItems} /> */}

      {/* Main Content */}
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="p-8">
          

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className={`p-6 ${getCardBorderClasses(index, statsData.length)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 ${stat.iconBg}`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${stat.valueColor || ''}`}>{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 border-t border-border">
            
            {/* Strategy Performance - Takes 2 columns */}
            <div className="lg:col-span-2 border-[0.5px] border-l-0">
              <div className="flex items-center justify-between p-6 border-b-[0.5px]">
                <div>
                  <h3 className="text-lg font-semibold">Active Strategies</h3>
                  <p className="text-sm text-muted-foreground">Real-time performance monitoring</p>
                </div>
                <button className="text-sm text-primary hover:underline">View All</button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Mean Reversion Alpha</div>
                        <div className="text-sm text-muted-foreground">Running • $245K allocated</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+12.4%</div>
                      <div className="text-sm text-muted-foreground">24h</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Momentum Breakout</div>
                        <div className="text-sm text-muted-foreground">Running • $180K allocated</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+8.7%</div>
                      <div className="text-sm text-muted-foreground">24h</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Pairs Trading</div>
                        <div className="text-sm text-muted-foreground">Running • $120K allocated</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">-2.1%</div>
                      <div className="text-sm text-muted-foreground">24h</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Statistical Arbitrage</div>
                        <div className="text-sm text-muted-foreground">Running • $95K allocated</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">+5.3%</div>
                      <div className="text-sm text-muted-foreground">24h</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Signals - Takes 1 column */}
            <div className="border-[0.5px] border-l-[0.5px]">
              <div className="p-6 border-b-[0.5px]">
                <h3 className="text-lg font-semibold">Recent Signals</h3>
                <p className="text-sm text-muted-foreground">Latest trading alerts</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="h-3 w-3 bg-green-500 rounded-sm"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">AAPL Buy</div>
                      <div className="text-xs text-muted-foreground">Mean Reversion • $156.42</div>
                    </div>
                    <div className="text-xs text-muted-foreground">2m</div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="h-3 w-3 bg-red-500 rounded-sm"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">TSLA Sell</div>
                      <div className="text-xs text-muted-foreground">Momentum • $243.18</div>
                    </div>
                    <div className="text-xs text-muted-foreground">5m</div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="h-3 w-3 bg-yellow-500 rounded-sm"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">SPY Hold</div>
                      <div className="text-xs text-muted-foreground">Pairs Trading • $412.89</div>
                    </div>
                    <div className="text-xs text-muted-foreground">12m</div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="h-3 w-3 bg-green-500 rounded-sm"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">MSFT Buy</div>
                      <div className="text-xs text-muted-foreground">Statistical Arb • $378.25</div>
                    </div>
                    <div className="text-xs text-muted-foreground">15m</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}