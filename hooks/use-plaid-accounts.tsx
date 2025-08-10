"use client"

import { useState, useEffect } from 'react'

export interface PlaidAccount {
  account_id: string
  balances: {
    available: number | null
    current: number
    iso_currency_code: string
    limit: number | null
    unofficial_currency_code: string | null
  }
  mask: string
  name: string
  official_name: string | null
  type: string
  subtype: string | null
}

export function usePlaidAccounts() {
  const [accounts, setAccounts] = useState<PlaidAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/plaid/accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  return { accounts, loading, error, refetch: fetchAccounts }
}