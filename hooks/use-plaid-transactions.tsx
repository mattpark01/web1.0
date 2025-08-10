"use client"

import { useState, useEffect } from 'react'

export interface PlaidTransaction {
  account_id: string
  amount: number
  iso_currency_code: string | null
  unofficial_currency_code: string | null
  category: string[] | null
  category_id: string | null
  date: string
  datetime: string | null
  location: {
    address: string | null
    city: string | null
    country: string | null
    lat: number | null
    lon: number | null
    postal_code: string | null
    region: string | null
    store_number: string | null
  }
  merchant_name: string | null
  name: string
  payment_channel: string
  pending: boolean
  pending_transaction_id: string | null
  transaction_id: string
  transaction_type: string
}

export function usePlaidTransactions() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/plaid/transactions')
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return { transactions, loading, error, refetch: fetchTransactions }
}