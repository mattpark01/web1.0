"use client"

import { useState } from 'react'
import { X, Send, Search, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface SendMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
}

export function SendMoneyModal({ isOpen, onClose, accounts }: SendMoneyModalProps) {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.account_id || '')
  const [note, setNote] = useState('')

  if (!isOpen) return null

  const handleSend = () => {
    // TODO: Implement actual send money logic
    console.log('Sending money:', { amount, recipient, selectedAccount, note })
    onClose()
  }

  const availableBalance = accounts.find(a => a.account_id === selectedAccount)?.balances?.available || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Send Money</h2>

        <div className="space-y-4">
          {/* From Account */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">From Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
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

          {/* Recipient */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Send To</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Email, phone, or username"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border rounded-lg bg-background"
              />
            </div>
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

          {/* Note */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Note (Optional)</label>
            <textarea
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border rounded-lg bg-background resize-none"
              rows={3}
            />
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {[10, 25, 50, 100].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="flex-1 py-2 border rounded-lg hover:bg-muted transition-colors text-sm"
              >
                ${quickAmount}
              </button>
            ))}
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
              onClick={handleSend}
              disabled={!amount || !recipient || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Money
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}