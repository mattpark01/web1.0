import { 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  Landmark, 
  TrendingUp, 
  Home,
  Building2,
  Banknote,
  ShoppingCart,
  Coffee,
  Car,
  Plane,
  ShoppingBag,
  Utensils,
  Fuel,
  Heart,
  GraduationCap,
  Tv,
  Smartphone,
  Gift,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react'

export function getAccountIcon(type: string, subtype: string | null) {
  // Account type icons
  if (type === 'investment' || type === 'brokerage') return TrendingUp
  if (type === 'credit') return CreditCard
  if (type === 'loan' || type === 'mortgage') return Home
  if (type === 'depository') {
    if (subtype === 'savings') return PiggyBank
    if (subtype === 'cd') return Landmark
    return Wallet
  }
  return Banknote
}

export function getAccountColor(type: string, subtype: string | null) {
  // Return neutral background for all account types
  return 'bg-background'
}

export function getAccountTextColor(type: string, subtype: string | null) {
  // Return muted foreground for all account types
  return 'text-muted-foreground'
}

export function getTransactionIcon(category: string[] | null, merchantName: string | null) {
  if (!category || category.length === 0) {
    return Receipt
  }

  const mainCategory = category[0].toLowerCase()
  
  // Map categories to icons
  if (mainCategory.includes('food') || mainCategory.includes('restaurant')) return Utensils
  if (mainCategory.includes('coffee') || mainCategory.includes('cafe')) return Coffee
  if (mainCategory.includes('transport') || mainCategory.includes('uber') || mainCategory.includes('lyft')) return Car
  if (mainCategory.includes('travel') || mainCategory.includes('airlines') || mainCategory.includes('hotel')) return Plane
  if (mainCategory.includes('shop') || mainCategory.includes('retail')) return ShoppingBag
  if (mainCategory.includes('grocery') || mainCategory.includes('supermarket')) return ShoppingCart
  if (mainCategory.includes('gas') || mainCategory.includes('fuel')) return Fuel
  if (mainCategory.includes('health') || mainCategory.includes('medical') || mainCategory.includes('pharmacy')) return Heart
  if (mainCategory.includes('education') || mainCategory.includes('school')) return GraduationCap
  if (mainCategory.includes('entertainment') || mainCategory.includes('streaming')) return Tv
  if (mainCategory.includes('phone') || mainCategory.includes('mobile')) return Smartphone
  if (mainCategory.includes('gift')) return Gift
  if (mainCategory.includes('transfer') || mainCategory.includes('payment')) return DollarSign
  
  // Check merchant name as fallback
  if (merchantName) {
    const merchant = merchantName.toLowerCase()
    if (merchant.includes('starbucks') || merchant.includes('coffee')) return Coffee
    if (merchant.includes('uber') || merchant.includes('lyft')) return Car
    if (merchant.includes('amazon')) return ShoppingCart
    if (merchant.includes('mcdonald') || merchant.includes('burger')) return Utensils
  }
  
  return Receipt
}

export function getTransactionColor(amount: number) {
  // Use muted background for all transactions
  return 'bg-muted'
}

export function getTransactionIconColor(amount: number) {
  // Subtle color coding - red for money out, green for money in
  return amount > 0 ? 'text-red-500' : 'text-green-600'
}