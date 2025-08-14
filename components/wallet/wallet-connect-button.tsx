"use client"

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Wallet, Copy, LogOut, ChevronDown, Building2, Globe, Coins, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { formatEther } from 'viem'

export function WalletConnectButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const [copied, setCopied] = useState(false)
  const [web3DialogOpen, setWeb3DialogOpen] = useState(false)
  const [robinhoodDialogOpen, setRobinhoodDialogOpen] = useState(false)
  const [alpacaDialogOpen, setAlpacaDialogOpen] = useState(false)
  const [coinbaseDialogOpen, setCoinbaseDialogOpen] = useState(false)
  
  // Mock connected providers state
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set())

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Check if any provider is connected
  const hasAnyConnection = isConnected || connectedProviders.size > 0
  
  if (!hasAnyConnection) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" disabled={isPending}>
              Connect
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Choose Provider</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setWeb3DialogOpen(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              Web3 Wallet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRobinhoodDialogOpen(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Robinhood
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAlpacaDialogOpen(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              Alpaca
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCoinbaseDialogOpen(true)}>
              <Coins className="h-4 w-4 mr-2" />
              Coinbase
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Globe className="h-4 w-4 mr-2" />
              Interactive Brokers
              <span className="ml-auto text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Building2 className="h-4 w-4 mr-2" />
              TD Ameritrade
              <span className="ml-auto text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Web3 Wallet Dialog */}
        <Dialog open={web3DialogOpen} onOpenChange={setWeb3DialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Web3 Wallet</DialogTitle>
              <DialogDescription>
                Choose your preferred Web3 wallet to connect to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 px-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  className="w-full flex items-center justify-start bg-muted/50 hover:bg-muted py-4 px-6 h-auto rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                  onClick={() => {
                    connect({ connector })
                    setWeb3DialogOpen(false)
                  }}
                  disabled={isPending}
                >
                  <Wallet className="h-4 w-4 mr-3" />
                  {connector.name}
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setWeb3DialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Robinhood Dialog */}
        <Dialog open={robinhoodDialogOpen} onOpenChange={setRobinhoodDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Robinhood</DialogTitle>
              <DialogDescription>
                Connect your Robinhood account to track your investments and portfolio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="Enter your Robinhood username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="Enter your password"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Your credentials are encrypted and never stored on our servers.
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRobinhoodDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setRobinhoodDialogOpen(false)}>
                Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alpaca Dialog */}
        <Dialog open={alpacaDialogOpen} onOpenChange={setAlpacaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Alpaca</DialogTitle>
              <DialogDescription>
                Enter your Alpaca API credentials to enable trading and portfolio management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-xs"
                  placeholder="PK..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-xs"
                  placeholder="Enter your secret key"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="paper-trading" />
                <label htmlFor="paper-trading" className="text-sm">
                  Use Paper Trading Account
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAlpacaDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAlpacaDialogOpen(false)}>
                Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Coinbase Dialog */}
        <Dialog open={coinbaseDialogOpen} onOpenChange={setCoinbaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Coinbase</DialogTitle>
              <DialogDescription>
                Authorize access to your Coinbase account to view and manage your crypto portfolio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm mb-2">You will be redirected to Coinbase to authorize access.</p>
                <p className="text-xs text-muted-foreground">
                  We request read-only access to view your balances and transaction history.
                </p>
              </div>
              <Button className="w-full" onClick={() => {
                // Would trigger OAuth flow
                setCoinbaseDialogOpen(false)
              }}>
                <Coins className="h-4 w-4 mr-2" />
                Authorize with Coinbase
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCoinbaseDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Connected Accounts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Web3 Account */}
          {isConnected && (
            <>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Web3 Wallet</span>
                  </div>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  {formatAddress(address!)} • {chain?.name || 'Ethereum'}
                </div>
                {balance && (
                  <div className="text-xs text-muted-foreground pl-6">
                    {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Robinhood Account */}
          {connectedProviders.has('robinhood') && (
            <>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Robinhood</span>
                  </div>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  john.doe@example.com
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  Portfolio: $12,345.67
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Alpaca Account */}
          {connectedProviders.has('alpaca') && (
            <>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Alpaca</span>
                  </div>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  Paper Trading Account
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  Buying Power: $25,000.00
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Coinbase Account */}
          {connectedProviders.has('coinbase') && (
            <>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Coinbase</span>
                  </div>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  user@coinbase.com
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  Total Balance: 2.5 BTC
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Actions */}
          {isConnected && (
            <>
              <DropdownMenuItem onClick={copyAddress}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Web3 Address'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => disconnect()}>
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect Web3
              </DropdownMenuItem>
            </>
          )}
          
          {connectedProviders.has('robinhood') && (
            <DropdownMenuItem onClick={() => {
              setConnectedProviders(prev => {
                const next = new Set(prev)
                next.delete('robinhood')
                return next
              })
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Robinhood
            </DropdownMenuItem>
          )}
          
          {connectedProviders.has('alpaca') && (
            <DropdownMenuItem onClick={() => {
              setConnectedProviders(prev => {
                const next = new Set(prev)
                next.delete('alpaca')
                return next
              })
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Alpaca
            </DropdownMenuItem>
          )}
          
          {connectedProviders.has('coinbase') && (
            <DropdownMenuItem onClick={() => {
              setConnectedProviders(prev => {
                const next = new Set(prev)
                next.delete('coinbase')
                return next
              })
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Coinbase
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Add More Accounts */}
          <DropdownMenuLabel className="text-xs">Add More Accounts</DropdownMenuLabel>
          {!isConnected && (
            <DropdownMenuItem onClick={() => setWeb3DialogOpen(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Web3 Wallet
            </DropdownMenuItem>
          )}
          {!connectedProviders.has('robinhood') && (
            <DropdownMenuItem onClick={() => setRobinhoodDialogOpen(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Connect Robinhood
            </DropdownMenuItem>
          )}
          {!connectedProviders.has('alpaca') && (
            <DropdownMenuItem onClick={() => setAlpacaDialogOpen(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              Connect Alpaca
            </DropdownMenuItem>
          )}
          {!connectedProviders.has('coinbase') && (
            <DropdownMenuItem onClick={() => setCoinbaseDialogOpen(true)}>
              <Coins className="h-4 w-4 mr-2" />
              Connect Coinbase
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Web3 Wallet Dialog */}
      <Dialog open={web3DialogOpen} onOpenChange={setWeb3DialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Web3 Wallet</DialogTitle>
            <DialogDescription>
              Choose your preferred Web3 wallet to connect to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                className="w-full flex items-center justify-start bg-muted/50 hover:bg-muted py-4 px-6 h-auto rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                onClick={() => {
                  connect({ connector })
                  setWeb3DialogOpen(false)
                }}
                disabled={isPending}
              >
                <Wallet className="h-4 w-4 mr-3" />
                {connector.name}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWeb3DialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Robinhood Dialog */}
      <Dialog open={robinhoodDialogOpen} onOpenChange={setRobinhoodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Robinhood</DialogTitle>
            <DialogDescription>
              Connect your Robinhood account to track your investments and portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="Enter your Robinhood username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="Enter your password"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Your credentials are encrypted and never stored on our servers.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRobinhoodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setConnectedProviders(prev => new Set([...prev, 'robinhood']))
              setRobinhoodDialogOpen(false)
            }}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alpaca Dialog */}
      <Dialog open={alpacaDialogOpen} onOpenChange={setAlpacaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Alpaca</DialogTitle>
            <DialogDescription>
              Enter your Alpaca API credentials to enable trading and portfolio management.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-xs"
                placeholder="PK..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Key</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-xs"
                placeholder="Enter your secret key"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="paper-trading-connected" />
              <label htmlFor="paper-trading-connected" className="text-sm">
                Use Paper Trading Account
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAlpacaDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setConnectedProviders(prev => new Set([...prev, 'alpaca']))
              setAlpacaDialogOpen(false)
            }}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coinbase Dialog */}
      <Dialog open={coinbaseDialogOpen} onOpenChange={setCoinbaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Coinbase</DialogTitle>
            <DialogDescription>
              Authorize access to your Coinbase account to view and manage your crypto portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-2">You will be redirected to Coinbase to authorize access.</p>
              <p className="text-xs text-muted-foreground">
                We request read-only access to view your balances and transaction history.
              </p>
            </div>
            <Button className="w-full" onClick={() => {
              // Would trigger OAuth flow
              setConnectedProviders(prev => new Set([...prev, 'coinbase']))
              setCoinbaseDialogOpen(false)
            }}>
              <Coins className="h-4 w-4 mr-2" />
              Authorize with Coinbase
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCoinbaseDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}