import { Activity, TrendingUp, BarChart3, DollarSign } from "lucide-react"
import { Superellipse } from "@/components/ui/superellipse/superellipse"

export default function QuantPage() {
  return (
    <div className="space-y-12 p-8">
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Superellipse 
          cornerRadius={8} 
          cornerSmoothing={1} 
          className="p-6"
          border={true}
          borderWidth={1}
          borderColor="hsl(var(--border))"
          borderOpacity={1}
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Active Strategies</span>
          </div>
          <div className="text-2xl font-bold mb-1">12</div>
          <p className="text-xs text-muted-foreground">Running algorithms</p>
        </Superellipse>
        
        <Superellipse cornerRadius={8} cornerSmoothing={1} className="border p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Today's P&L</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">+$2,847</div>
          <p className="text-xs text-muted-foreground">+2.3% vs yesterday</p>
        </Superellipse>
        
        <Superellipse cornerRadius={8} cornerSmoothing={1} className="border p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Win Rate</span>
          </div>
          <div className="text-2xl font-bold mb-1">67.4%</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </Superellipse>
        
        <Superellipse cornerRadius={8} cornerSmoothing={1} className="border p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">AUM</span>
          </div>
          <div className="text-2xl font-bold mb-1">$1.2M</div>
          <p className="text-xs text-muted-foreground">Assets under management</p>
        </Superellipse>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Superellipse cornerRadius={8} cornerSmoothing={1} className="border p-8">
          <h3 className="text-lg font-medium mb-6">Strategy Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Mean Reversion Alpha</span>
              <span className="text-sm font-medium text-green-600">+12.4%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Momentum Breakout</span>
              <span className="text-sm font-medium text-green-600">+8.7%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pairs Trading</span>
              <span className="text-sm font-medium text-red-600">-2.1%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Statistical Arbitrage</span>
              <span className="text-sm font-medium text-green-600">+5.3%</span>
            </div>
          </div>
        </Superellipse>
        
        <Superellipse cornerRadius={8} cornerSmoothing={1} className="border p-8">
          <h3 className="text-lg font-medium mb-6">Recent Signals</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Superellipse cornerRadius={4} cornerSmoothing={1} className="h-3 w-3 bg-green-500"></Superellipse>
                <span className="text-sm">AAPL Buy Signal</span>
              </div>
              <span className="text-xs text-muted-foreground">2m ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Superellipse cornerRadius={4} cornerSmoothing={1} className="h-3 w-3 bg-red-500"></Superellipse>
                <span className="text-sm">TSLA Sell Signal</span>
              </div>
              <span className="text-xs text-muted-foreground">5m ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Superellipse cornerRadius={4} cornerSmoothing={1} className="h-3 w-3 bg-yellow-500"></Superellipse>
                <span className="text-sm">SPY Neutral</span>
              </div>
              <span className="text-xs text-muted-foreground">12m ago</span>
            </div>
          </div>
        </Superellipse>
      </div>
    </div>
  )
}