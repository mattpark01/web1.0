import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Create wagmi config
export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Spatio Bank' }),
    // Uncomment and add your WalletConnect project ID if you want to use WalletConnect
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}