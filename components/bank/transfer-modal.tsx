"use client"

import { useState } from 'react'
import { X, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
}

export function TransferModal({ isOpen, onClose, accounts }: TransferModalProps) {
  const [amount, setAmount] = useState('')
  const [fromAccount, setFromAccount] = useState(accounts[0]?.account_id || '')
  const [toAccount, setToAccount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleTransfer = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // In sandbox, we'll simulate the transfer
      // In production with Transfer access, this would make a real API call
      const response = await fetch('/api/plaid/transfer/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: fromAccount,
          amount: parseFloat(amount),
          type: 'debit', // Taking money from the account
          description: description || `Transfer to ${toAccount}`,
          recipientAccountId: toAccount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || data.reason || 'Transfer failed')
      }
    } catch (err) {
      setError('Failed to process transfer. This feature requires Plaid Transfer access.')
    } finally {
      setLoading(false)
    }
  }

  const fromAccountData = accounts.find(a => a.account_id === fromAccount)
  const availableBalance = fromAccountData?.balances?.available || 0

  // Filter out the selected from account for the to account options
  const toAccountOptions = accounts.filter(a => a.account_id !== fromAccount)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Transfer Between Accounts</h2>

        {!result && !error && (
          <div className="space-y-4">
            {/* From Account */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">From Account</label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full p-3 border rounded-lg bg-background"
              >
                {accounts.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.name} - {formatCurrency(account.balances.available)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Available: {formatCurrency(availableBalance)}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* To Account */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">To Account</label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full p-3 border rounded-lg bg-background"
                disabled={toAccountOptions.length === 0}
              >
                <option value="">Select account</option>
                {toAccountOptions.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.name} - Current: {formatCurrency(account.balances.current)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-3 border rounded-lg bg-background text-2xl font-bold"
                  step="0.01"
                  min="0"
                  max={availableBalance}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Description (Optional)</label>
              <input
                type="text"
                placeholder="What's this transfer for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded-lg bg-background"
              />
            </div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Sandbox Mode</p>
                  <p className="text-xs mt-1">
                    Transfers are simulated in sandbox. Real transfers require Plaid Transfer product access.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!amount || !toAccount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance || loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Transfer Initiated!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {formatCurrency(parseFloat(amount))} has been transferred successfully.
                  </p>
                  {result.transfer && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Transfer ID: {result.transfer.id}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setResult(null)
                setAmount('')
                setDescription('')
                onClose()
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error Result */}
        {error && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Transfer Failed</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="w-full py-3 border rounded-lg hover:bg-muted transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}