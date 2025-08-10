"use client"

import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Plus } from 'lucide-react'

interface PlaidLinkButtonProps {
  onSuccess?: (publicToken: string, metadata: any) => void
  onExit?: () => void
  userId?: string
}

export function PlaidLinkButton({ onSuccess, onExit, userId }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const createLinkToken = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId || 'default-user' }),
        })
        const data = await response.json()
        setLinkToken(data.link_token)
      } catch (error) {
        console.error('Error creating link token:', error)
      } finally {
        setLoading(false)
      }
    }
    createLinkToken()
  }, [userId])

  const handleOnSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        const response = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            public_token: publicToken,
            metadata: metadata 
          }),
        })
        const data = await response.json()
        
        if (data.success) {
          onSuccess?.(publicToken, metadata)
        }
      } catch (error) {
        console.error('Error exchanging public token:', error)
      }
    },
    [onSuccess]
  )

  const config = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: onExit || (() => {}),
  }

  const { open, ready } = usePlaidLink(config)

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Plus className="h-4 w-4" />
      {loading ? 'Loading...' : 'Connect Bank Account'}
    </button>
  )
}