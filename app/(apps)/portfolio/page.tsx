"use client"

import { TrendingUp, BarChart3, DollarSign } from "lucide-react"
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button"
import { BrokerageConnect } from "@/components/wallet/brokerage-connect"
import { UnifiedPortfolio } from "@/components/portfolio/unified-portfolio"

export default function PortfolioPage() {
  return (
    <div className="h-full">
      {/* Main content */}
      <div className="flex flex-col h-full">
        {/* Portfolio overview */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Portfolio Overview</h1>
              <div className="flex items-center gap-2">
                <WalletConnectButton />
                <BrokerageConnect />
              </div>
            </div>

            {/* Unified Portfolio Component */}
            <UnifiedPortfolio />

            {/* Legacy Portfolio cards - Hidden but kept for reference */}
            <div className="hidden grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className=" border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-semibold">$124,567.89</p>
                  </div>
                  <div className=" bg-green-100 p-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>

              <div className=" border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Gain</p>
                    <p className="text-xl font-semibold text-green-600">+$2,891.23</p>
                  </div>
                  <div className=" bg-green-100 p-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>

              <div className=" border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className="text-xl font-semibold text-green-600">+12.45%</p>
                  </div>
                  <div className=" bg-green-100 p-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Holdings table */}
            <div className=" border">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Holdings</h2>
              </div>
              <div className="space-y-0">
                <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8  bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">AAPL</span>
                    </div>
                    <div>
                      <p className="font-medium">Apple Inc.</p>
                      <p className="text-sm text-muted-foreground">25 shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$4,287.50</p>
                    <p className="text-sm text-green-600">+1.2%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8  bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-purple-600">TSLA</span>
                    </div>
                    <div>
                      <p className="font-medium">Tesla, Inc.</p>
                      <p className="text-sm text-muted-foreground">15 shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$3,456.75</p>
                    <p className="text-sm text-red-600">-0.8%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8  bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-green-600">NVDA</span>
                    </div>
                    <div>
                      <p className="font-medium">NVIDIA Corp.</p>
                      <p className="text-sm text-muted-foreground">8 shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$6,123.64</p>
                    <p className="text-sm text-green-600">+3.4%</p>
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