"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, TrendingUp, Shield, Link2, Loader2 } from 'lucide-react'

interface BrokerageProvider {
  id: string
  name: string
  description: string
  icon: React.ElementType
  type: 'plaid' | 'alpaca' | 'manual'
}

const brokerageProviders: BrokerageProvider[] = [
  {
    id: 'plaid',
    name: 'Connect Investment Account',
    description: 'Link Charles Schwab, Fidelity, Vanguard, E*TRADE, and 100+ brokerages',
    icon: Link2,
    type: 'plaid'
  },
  {
    id: 'alpaca',
    name: 'Alpaca Markets',
    description: 'Connect your Alpaca account for commission-free trading',
    icon: TrendingUp,
    type: 'alpaca'
  },
  {
    id: 'manual',
    name: 'Track Manually',
    description: 'Enter your positions manually for offline accounts',
    icon: Building2,
    type: 'manual'
  }
]

export function BrokerageConnect() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<BrokerageProvider | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const onPlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    try {
      setLoading(true)
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          public_token: publicToken, 
          metadata,
          isInvestment: true // Flag to indicate this is for investment accounts
        })
      })
      
      if (response.ok) {
        setIsOpen(false)
        // Trigger portfolio refresh
        window.dispatchEvent(new Event('portfolio-refresh'))
      }
    } catch (error) {
      console.error('Error exchanging Plaid token:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  })

  const createPlaidLinkToken = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plaid/create-investment-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'default-user' })
      })
      const data = await response.json()
      setLinkToken(data.link_token)
    } catch (error) {
      console.error('Error creating Plaid link token:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleProviderSelect = useCallback(async (provider: BrokerageProvider) => {
    setSelectedProvider(provider)
    
    if (provider.type === 'plaid') {
      await createPlaidLinkToken()
    } else if (provider.type === 'alpaca') {
      window.location.href = '/api/brokerages/alpaca/auth'
    }
  }, [createPlaidLinkToken])

  // Open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && plaidReady && selectedProvider?.type === 'plaid') {
      openPlaid()
    }
  }, [linkToken, plaidReady, selectedProvider, openPlaid])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
          ) : (
            <><Building2 className="h-4 w-4 mr-2" /> Connect Brokerage</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Your Brokerage Account</DialogTitle>
          <DialogDescription>
            Link your brokerage accounts to sync your portfolio and enable live trading
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {brokerageProviders.map((provider) => {
            const Icon = provider.icon
            return (
              <Card 
                key={provider.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleProviderSelect(provider)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Your credentials are encrypted and never stored directly</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}