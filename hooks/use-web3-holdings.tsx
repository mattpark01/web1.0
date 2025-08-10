"use client"

import { useEffect, useState } from 'react'
import { useAccount, useBalance, usePublicClient } from 'wagmi'
import { formatEther, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

interface TokenBalance {
  symbol: string
  name: string
  balance: string
  decimals: number
  address: string
  price?: number
  value?: number
}

// Popular ERC20 tokens to check
const POPULAR_TOKENS = [
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  { address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', symbol: 'wstETH', name: 'Wrapped stETH', decimals: 18 },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
]

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
])

export function useWeb3Holdings() {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()
  const { data: ethBalance } = useBalance({ address })
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [totalValue, setTotalValue] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTokenBalances() {
      if (!address || !isConnected || !publicClient) {
        setTokenBalances([])
        setTotalValue(0)
        return
      }

      setLoading(true)
      setError(null)
      const balances: TokenBalance[] = []

      // Add ETH balance
      if (ethBalance) {
        const ethPrice = await fetchTokenPrice('ethereum')
        const ethValue = parseFloat(formatEther(ethBalance.value))
        balances.push({
          symbol: 'ETH',
          name: 'Ethereum',
          balance: ethValue.toString(),
          decimals: 18,
          address: '0x0',
          price: ethPrice,
          value: ethValue * (ethPrice || 0)
        })
      }

      // Check popular token balances
      for (const token of POPULAR_TOKENS) {
        try {
          const balance = await publicClient.readContract({
            address: token.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          })

          if (balance && balance > 0n) {
            const formattedBalance = formatUnits(balance, token.decimals)
            const price = await fetchTokenPrice(token.symbol.toLowerCase())
            
            balances.push({
              ...token,
              balance: formattedBalance,
              price,
              value: parseFloat(formattedBalance) * (price || 0)
            })
          }
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error)
        }
      }

      // Fetch NFTs (optional)
      try {
        const nfts = await fetchNFTs(address)
        // Add NFT value to total if needed
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      }

      setTokenBalances(balances)
      
      // Calculate total value
      const total = balances.reduce((sum, token) => sum + (token.value || 0), 0)
      setTotalValue(total)
      
      setLoading(false)
    }

    fetchTokenBalances().catch(err => {
      console.error('Error in fetchTokenBalances:', err)
      setError('Failed to fetch token balances')
      setLoading(false)
    })
  }, [address, isConnected, publicClient, ethBalance])

  return { tokenBalances, totalValue, loading, ethBalance, error }
}

function formatUnits(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals)
  const quotient = value / divisor
  const remainder = value % divisor
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const trimmed = remainderStr.replace(/0+$/, '')
  return trimmed ? `${quotient}.${trimmed}` : quotient.toString()
}

async function fetchTokenPrice(tokenId: string): Promise<number | undefined> {
  try {
    // Use CoinGecko API (free tier)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    )
    const data = await response.json()
    return data[tokenId]?.usd
  } catch (error) {
    console.error('Error fetching price:', error)
    // Fallback prices for common tokens
    const fallbackPrices: Record<string, number> = {
      ethereum: 2500,
      usdc: 1,
      usdt: 1,
      dai: 1,
      wbtc: 45000,
      link: 15,
      uni: 6,
    }
    return fallbackPrices[tokenId]
  }
}

async function fetchNFTs(address: string) {
  // Optional: Use Alchemy or OpenSea API to fetch NFTs
  // This requires an API key
  return []
}