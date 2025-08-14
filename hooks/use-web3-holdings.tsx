"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAccount, useBalance, usePublicClient, useWatchContractEvent } from 'wagmi'
import { formatEther, parseAbi, formatUnits as viemFormatUnits, createPublicClient, http } from 'viem'
import { mainnet, polygon, arbitrum, optimism, base, bsc } from 'viem/chains'

interface TokenBalance {
  symbol: string
  name: string
  balance: string
  decimals: number
  address: string
  price?: number
  value?: number
  chainId: number
  chainName: string
}

// Chain configurations
const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', chain: mainnet, nativeCurrency: 'ETH', coingeckoId: 'ethereum' },
  { id: 137, name: 'Polygon', chain: polygon, nativeCurrency: 'MATIC', coingeckoId: 'matic-network' },
  { id: 42161, name: 'Arbitrum', chain: arbitrum, nativeCurrency: 'ETH', coingeckoId: 'ethereum' },
  { id: 10, name: 'Optimism', chain: optimism, nativeCurrency: 'ETH', coingeckoId: 'ethereum' },
  { id: 8453, name: 'Base', chain: base, nativeCurrency: 'ETH', coingeckoId: 'ethereum' },
  { id: 56, name: 'BNB Chain', chain: bsc, nativeCurrency: 'BNB', coingeckoId: 'binancecoin' },
]

// Popular tokens by chain
const TOKENS_BY_CHAIN: Record<number, Array<{address: string, symbol: string, name: string, decimals: number, coingeckoId?: string}>> = {
  // Ethereum Mainnet
  1: [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, coingeckoId: 'wrapped-bitcoin' },
    { address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', symbol: 'wstETH', name: 'Wrapped stETH', decimals: 18, coingeckoId: 'wrapped-steth' },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18, coingeckoId: 'chainlink' },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18, coingeckoId: 'uniswap' },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, coingeckoId: 'weth' },
  ],
  // Polygon
  137: [
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', name: 'Wrapped Matic', decimals: 18, coingeckoId: 'wmatic' },
  ],
  // Arbitrum
  42161: [
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, coingeckoId: 'weth' },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18, coingeckoId: 'arbitrum' },
  ],
  // Optimism
  10: [
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, coingeckoId: 'weth' },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18, coingeckoId: 'optimism' },
  ],
  // Base
  8453: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, coingeckoId: 'weth' },
  ],
  // BNB Chain
  56: [
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18, coingeckoId: 'usd-coin' },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18, coingeckoId: 'tether' },
    { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18, coingeckoId: 'binance-usd' },
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18, coingeckoId: 'wbnb' },
  ],
}

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
])

const ERC20_TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

// Create public clients for each chain
const createChainClient = (chain: any) => {
  return createPublicClient({
    chain,
    transport: http(),
  })
}

export function useWeb3Holdings(pollingInterval: number = 30000, enableWebSocket: boolean = true) {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({ 
    address,
    watch: true
  })
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [totalValue, setTotalValue] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLiveUpdating, setIsLiveUpdating] = useState(false)

  const fetchTokenBalances = useCallback(async () => {
    if (!address || !isConnected) {
      setTokenBalances([])
      setTotalValue(0)
      return
    }

    setLoading(true)
    setError(null)
    const allBalances: TokenBalance[] = []

    // Fetch balances across all supported chains
    for (const chainConfig of SUPPORTED_CHAINS) {
      try {
        const chainClient = createChainClient(chainConfig.chain)
        
        // Fetch native token balance for this chain
        try {
          const nativeBalance = await chainClient.getBalance({ address })
          if (nativeBalance > 0n) {
            const price = await fetchTokenPrice(chainConfig.coingeckoId)
            const formattedBalance = formatEther(nativeBalance)
            const value = parseFloat(formattedBalance) * (price || 0)
            
            allBalances.push({
              symbol: chainConfig.nativeCurrency,
              name: `${chainConfig.nativeCurrency} on ${chainConfig.name}`,
              balance: formattedBalance,
              decimals: 18,
              address: '0x0',
              price,
              value,
              chainId: chainConfig.id,
              chainName: chainConfig.name
            })
          }
        } catch (error) {
          console.error(`Error fetching ${chainConfig.nativeCurrency} balance on ${chainConfig.name}:`, error)
        }

        // Fetch ERC20 token balances for this chain
        const chainTokens = TOKENS_BY_CHAIN[chainConfig.id] || []
        for (const token of chainTokens) {
          try {
            const balance = await chainClient.readContract({
              address: token.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            })

            if (balance && balance > 0n) {
              const formattedBalance = viemFormatUnits(balance, token.decimals)
              const price = await fetchTokenPrice(token.coingeckoId || token.symbol.toLowerCase())
              const value = parseFloat(formattedBalance) * (price || 0)
              
              allBalances.push({
                ...token,
                balance: formattedBalance,
                price,
                value,
                chainId: chainConfig.id,
                chainName: chainConfig.name,
                name: `${token.name} on ${chainConfig.name}`
              })
            }
          } catch (error) {
            // Silently skip tokens that don't exist on this chain
          }
        }
      } catch (error) {
        console.error(`Error fetching balances for ${chainConfig.name}:`, error)
      }
    }

    setTokenBalances(allBalances)
    
    // Calculate total value
    const total = allBalances.reduce((sum, token) => sum + (token.value || 0), 0)
    setTotalValue(total)
    setLastUpdated(new Date())
    
    setLoading(false)
  }, [address, isConnected])

  // Initial fetch and setup polling
  useEffect(() => {
    fetchTokenBalances().catch(err => {
      console.error('Error in fetchTokenBalances:', err)
      setError('Failed to fetch token balances')
      setLoading(false)
    })

    // Set up polling interval if enabled
    if (pollingInterval > 0) {
      const interval = setInterval(() => {
        fetchTokenBalances().catch(err => {
          console.error('Error in fetchTokenBalances (polling):', err)
          setError('Failed to fetch token balances')
        })
      }, pollingInterval)

      return () => clearInterval(interval)
    }
  }, [address, isConnected, pollingInterval, fetchTokenBalances])

  // Watch for ERC20 Transfer events on current chain
  useWatchContractEvent({
    abi: ERC20_TRANSFER_ABI,
    eventName: 'Transfer',
    enabled: enableWebSocket && isConnected && !!address,
    onLogs: (logs) => {
      const relevantTransfer = logs.some(
        log => log.args?.from === address || log.args?.to === address
      )
      
      if (relevantTransfer) {
        setIsLiveUpdating(true)
        fetchTokenBalances().then(() => {
          setIsLiveUpdating(false)
        })
      }
    },
  })

  // Watch for balance changes on current chain
  useEffect(() => {
    if (!enableWebSocket || !publicClient || !address) return

    const unwatch = publicClient.watchBlockNumber({
      onBlockNumber: async (blockNumber) => {
        if (blockNumber % 3n === 0n) {
          const currentBalance = await publicClient.getBalance({ address })
          if (ethBalance && currentBalance !== ethBalance.value) {
            setIsLiveUpdating(true)
            await fetchTokenBalances()
            setIsLiveUpdating(false)
          }
        }
      },
    })

    return () => unwatch()
  }, [publicClient, address, ethBalance, enableWebSocket, fetchTokenBalances])

  // Manual refresh function
  const refresh = async () => {
    setIsLiveUpdating(true)
    await fetchTokenBalances()
    setIsLiveUpdating(false)
  }

  return { 
    tokenBalances, 
    totalValue, 
    loading, 
    ethBalance, 
    error, 
    lastUpdated,
    refresh,
    isLiveUpdating 
  }
}

// Cache for token prices to avoid hitting rate limits
const priceCache = new Map<string, { price: number, timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute

async function fetchTokenPrice(tokenId: string): Promise<number | undefined> {
  // Check cache first
  const cached = priceCache.get(tokenId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price
  }

  try {
    // Map common token IDs to CoinGecko IDs
    const coingeckoMap: Record<string, string> = {
      'eth': 'ethereum',
      'matic': 'matic-network',
      'bnb': 'binancecoin',
      'usdc': 'usd-coin',
      'usdt': 'tether',
      'dai': 'dai',
      'wbtc': 'wrapped-bitcoin',
      'link': 'chainlink',
      'uni': 'uniswap',
      'weth': 'ethereum',
      'wmatic': 'matic-network',
      'wbnb': 'binancecoin',
      'arb': 'arbitrum',
      'op': 'optimism',
      'busd': 'binance-usd',
    }
    
    const geckoId = coingeckoMap[tokenId.toLowerCase()] || tokenId.toLowerCase()
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`
    )
    const data = await response.json()
    const price = data[geckoId]?.usd
    
    if (price) {
      priceCache.set(tokenId, { price, timestamp: Date.now() })
      return price
    }
  } catch (error) {
    console.error('Error fetching price for', tokenId, error)
  }
  
  // Fallback prices
  const fallbackPrices: Record<string, number> = {
    ethereum: 2500,
    'matic-network': 0.5,
    binancecoin: 300,
    'usd-coin': 1,
    tether: 1,
    dai: 1,
    'wrapped-bitcoin': 45000,
    chainlink: 15,
    uniswap: 6,
    arbitrum: 1.2,
    optimism: 2,
    'binance-usd': 1,
  }
  
  return fallbackPrices[tokenId] || fallbackPrices[tokenId.toLowerCase()]
}

async function fetchNFTs(address: string) {
  // Optional: Implement NFT fetching
  return []
}