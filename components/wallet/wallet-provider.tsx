"use client"

import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { ReactNode } from 'react'

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, polygon, arbitrum, optimism, base],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [base.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'Web1.0 Portfolio',
    appDescription: 'Unified portfolio and trading platform',
    appUrl: 'https://web1.0.app',
    appIcon: 'https://web1.0.app/logo.png',
  })
)

const queryClient = new QueryClient()

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}