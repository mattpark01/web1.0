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
          </div>
        </div>
      </div>
    </div>
  )
}