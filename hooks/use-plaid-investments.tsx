"use client"

import { useState, useEffect } from 'react'

interface Investment {
  account_name: string
  account_type: string
  symbol: string
  name: string
  quantity: number
  price: number
  cost_basis: number
  value: number
  gain_loss: number
  gain_loss_percent: number
  type: string
}

interface InvestmentData {
  holdings: Investment[]
  total_value: number
  total_cost: number
  accounts: any[]
}

export function usePlaidInvestments() {
  const [investments, setInvestments] = useState<InvestmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvestments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/plaid/investments')
      
      if (!response.ok) {
        throw new Error('Failed to fetch investments')
      }
      
      const data = await response.json()
      setInvestments(data)
    } catch (err) {
      console.error('Error fetching investments:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestments()

    // Listen for portfolio refresh events
    const handleRefresh = () => {
      fetchInvestments()
    }

    window.addEventListener('portfolio-refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('portfolio-refresh', handleRefresh)
    }
  }, [])

  return {
    investments,
    loading,
    error,
    refetch: fetchInvestments
  }
}