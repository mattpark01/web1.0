export function formatCurrency(amount: number | null | undefined, showSign = false): string {
  if (amount === null || amount === undefined) return '$0.00'
  
  const absAmount = Math.abs(amount)
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount)
  
  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formattedAmount}` : `-${formattedAmount}`
  }
  
  return formattedAmount
}

export function formatAccountNumber(mask: string): string {
  if (!mask) return ''
  return `••••${mask}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  } else if (diffDays === 1) {
    return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true })
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}