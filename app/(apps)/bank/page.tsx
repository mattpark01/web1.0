"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Send, Receipt, CreditCard as CardIcon, PiggyBank as SaveIcon } from "lucide-react"
import { PlaidLinkButton } from "@/components/bank/plaid-link-button"
import { SendMoneyModal } from "@/components/bank/send-money-modal"
import { TransferModal } from "@/components/bank/transfer-modal"
import { usePlaidAccounts } from "@/hooks/use-plaid-accounts"
import { usePlaidTransactions } from "@/hooks/use-plaid-transactions"
import { formatCurrency, formatAccountNumber, formatDate } from "@/lib/utils/format"
import { getAccountIcon, getAccountColor, getAccountTextColor, getTransactionIcon, getTransactionColor, getTransactionIconColor } from "@/lib/utils/bank-icons"
// import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar"

export default function BankPage() {
  const { accounts, loading: accountsLoading, refetch: refetchAccounts } = usePlaidAccounts()
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = usePlaidTransactions()
  const [isConnected, setIsConnected] = useState(false)
  const [showSendMoney, setShowSendMoney] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)

  const handlePlaidSuccess = () => {
    setIsConnected(true)
    refetchAccounts()
    refetchTransactions()
  }

  const totalBalance = accounts.reduce((sum, account) => sum + (account.balances.current || 0), 0)
  // const sidebarItems: AppSidebarItem[] = [
  //   {
  //     id: "accounts",
  //     label: "Accounts",
  //     icon: Wallet,
  //     isActive: true,
  //   },
  //   {
  //     id: "cards",
  //     label: "Cards",
  //     icon: CreditCard,
  //   },
  //   {
  //     id: "transfers",
  //     label: "Transfers",
  //     icon: ArrowUpRight,
  //   },
  //   {
  //     id: "savings",
  //     label: "Savings",
  //     icon: PiggyBank,
  //   },
  // ]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {/* <AppSidebar items={sidebarItems} /> */}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Banking overview */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Banking Overview</h1>
              <div className="flex items-center gap-4">
                <PlaidLinkButton onSuccess={handlePlaidSuccess} />
                {accounts.length > 0 && (
                  <button
                    onClick={() => {
                      refetchAccounts()
                      refetchTransactions()
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    disabled={accountsLoading || transactionsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${(accountsLoading || transactionsLoading) ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Balance</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(accounts.length > 0 ? totalBalance : 45280.12)}
                  </div>
                </div>
              </div>
            </div>

            {/* Account cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountsLoading ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Loading accounts...
                </div>
              ) : accounts.length > 0 ? (
                accounts.map((account) => {
                  const AccountIcon = getAccountIcon(account.type, account.subtype)
                  
                  return (
                    <div 
                      key={account.account_id}
                      className="border rounded-lg p-6 hover:border-foreground/20 transition-all bg-background"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium">
                            {account.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatAccountNumber(account.mask)}
                          </p>
                        </div>
                        <AccountIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(account.balances.current)}
                      </div>
                      {account.balances.available && account.balances.available !== account.balances.current && (
                        <p className="text-xs mt-2 text-muted-foreground">
                          Available: {formatCurrency(account.balances.available)}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <>
                  <div className="border rounded-lg p-6 bg-background">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium">Checking Account</p>
                        <p className="text-xs text-muted-foreground">••••1234</p>
                      </div>
                      <CardIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(8450.67)}</div>
                  </div>

                  <div className="border rounded-lg p-6 bg-background">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium">Savings Account</p>
                        <p className="text-xs text-muted-foreground">••••5678</p>
                      </div>
                      <SaveIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(36829.45)}</div>
                  </div>
                </>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowSendMoney(true)}
                className="border rounded-lg p-4 hover:bg-muted transition-colors group"
                disabled={accounts.length === 0}
              >
                <Send className="h-5 w-5 mb-2 mx-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                <p className="text-sm">Send Money</p>
              </button>
              <button 
                className="border rounded-lg p-4 hover:bg-muted transition-colors group"
                disabled={accounts.length === 0}
              >
                <ArrowDownRight className="h-5 w-5 mb-2 mx-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                <p className="text-sm">Request</p>
              </button>
              <button 
                className="border rounded-lg p-4 hover:bg-muted transition-colors group"
                disabled={accounts.length === 0}
              >
                <Receipt className="h-5 w-5 mb-2 mx-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                <p className="text-sm">Pay Bills</p>
              </button>
              <button 
                onClick={() => setShowTransfer(true)}
                className="border rounded-lg p-4 hover:bg-muted transition-colors group"
                disabled={accounts.length < 2}
              >
                <SaveIcon className="h-5 w-5 mb-2 mx-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                <p className="text-sm">Transfer</p>
              </button>
            </div>

            {/* Recent transactions */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Recent Transactions</h2>
              </div>
              <div className="space-y-0">
                {transactionsLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading transactions...
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.slice(0, 10).map((transaction) => {
                    const TransactionIcon = getTransactionIcon(transaction.category, transaction.merchant_name)
                    const bgColor = getTransactionColor(transaction.amount)
                    const iconColor = getTransactionIconColor(transaction.amount)
                    
                    return (
                      <div 
                        key={transaction.transaction_id}
                        className="flex items-center justify-between p-4 border-b hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
                            <TransactionIcon className={`h-4 w-4 ${iconColor}`} />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${iconColor}`}>
                            {formatCurrency(Math.abs(transaction.amount), true)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.category?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Transaction'}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <>
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
                        <p className="font-medium text-green-600">{formatCurrency(3500.00, true)}</p>
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
                        <p className="font-medium text-red-600">{formatCurrency(127.45, true)}</p>
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
                        <p className="font-medium text-blue-600">{formatCurrency(500.00, true)}</p>
                        <p className="text-sm text-muted-foreground">Transfer</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10  bg-orange-100 flex items-center justify-center">
                          <CardIcon className="h-4 w-4 text-orange-600" />
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
                        <p className="font-medium text-red-600">{formatCurrency(4.50, true)}</p>
                        <p className="text-sm text-muted-foreground">Card</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SendMoneyModal 
        isOpen={showSendMoney} 
        onClose={() => setShowSendMoney(false)}
        accounts={accounts}
      />
      <TransferModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        accounts={accounts}
      />
    </div>
  )
}