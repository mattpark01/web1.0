"use client"

import { CreditCard, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Clock } from "lucide-react"
import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar"

export default function BankPage() {
  const sidebarItems: AppSidebarItem[] = [
    {
      id: "accounts",
      label: "Accounts",
      icon: Wallet,
      isActive: true,
    },
    {
      id: "cards",
      label: "Cards",
      icon: CreditCard,
    },
    {
      id: "transfers",
      label: "Transfers",
      icon: ArrowUpRight,
    },
    {
      id: "savings",
      label: "Savings",
      icon: PiggyBank,
    },
  ]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <AppSidebar items={sidebarItems} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Banking overview */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Banking Overview</h1>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Balance</div>
                <div className="text-2xl font-bold">$45,280.12</div>
              </div>
            </div>

            {/* Account cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className=" border p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-blue-700">Checking Account</p>
                    <p className="text-xs text-blue-600">****1234</p>
                  </div>
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">$8,450.67</div>
              </div>

              <div className=" border p-6 bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-700">Savings Account</p>
                    <p className="text-xs text-green-600">****5678</p>
                  </div>
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">$36,829.45</div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className=" border p-4 hover:bg-muted/50 transition-colors">
                <ArrowUpRight className="h-6 w-6 mb-2 mx-auto text-blue-600" />
                <p className="text-sm font-medium">Send Money</p>
              </button>
              <button className=" border p-4 hover:bg-muted/50 transition-colors">
                <ArrowDownRight className="h-6 w-6 mb-2 mx-auto text-green-600" />
                <p className="text-sm font-medium">Request</p>
              </button>
              <button className=" border p-4 hover:bg-muted/50 transition-colors">
                <CreditCard className="h-6 w-6 mb-2 mx-auto text-purple-600" />
                <p className="text-sm font-medium">Pay Bills</p>
              </button>
              <button className=" border p-4 hover:bg-muted/50 transition-colors">
                <PiggyBank className="h-6 w-6 mb-2 mx-auto text-orange-600" />
                <p className="text-sm font-medium">Save Money</p>
              </button>
            </div>

            {/* Recent transactions */}
            <div className=" border">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Recent Transactions</h2>
              </div>
              <div className="space-y-0">
                <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10  bg-green-100 flex items-center justify-center">
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Salary Deposit</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Today, 9:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+$3,500.00</p>
                    <p className="text-sm text-muted-foreground">Checking</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10  bg-red-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Grocery Store</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Yesterday, 6:30 PM
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">-$127.45</p>
                    <p className="text-sm text-muted-foreground">Checking</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10  bg-blue-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Transfer to Savings</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Dec 30, 2:15 PM
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blue-600">-$500.00</p>
                    <p className="text-sm text-muted-foreground">Transfer</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10  bg-orange-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Coffee Shop</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Dec 30, 8:45 AM
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">-$4.50</p>
                    <p className="text-sm text-muted-foreground">Card</p>
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