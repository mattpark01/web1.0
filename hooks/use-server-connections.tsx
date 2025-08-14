"use client"

import { useState, useCallback, useEffect } from 'react'
import { ServerConfig } from '@/components/quant/server-connection'

// Mock function to simulate server connection
const mockConnectToServer = async (url: string, apiKey?: string): Promise<boolean> => {
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Simulate success rate based on URL
  if (url.includes('localhost')) {
    return Math.random() > 0.2 // 80% success for localhost
  }
  if (url.includes('https')) {
    return Math.random() > 0.1 // 90% success for HTTPS
  }
  return Math.random() > 0.3 // 70% success for others
}

// Mock function to get server metrics
const mockGetServerMetrics = (): ServerConfig['metrics'] => ({
  cpu: Math.floor(Math.random() * 60 + 20),
  memory: Math.floor(Math.random() * 50 + 30),
  latency: Math.floor(Math.random() * 50 + 10),
  uptime: Math.floor(Math.random() * 5 + 95),
})

// Mock function to get trading stats
const mockGetTradingStats = () => ({
  strategies: Math.floor(Math.random() * 10 + 2),
  activeTrades: Math.floor(Math.random() * 20 + 5),
  totalValue: Math.floor(Math.random() * 500000 + 100000),
  pnl24h: (Math.random() * 10 - 2), // -2% to +8%
})

export function useServerConnections() {
  const [servers, setServers] = useState<ServerConfig[]>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quant-servers')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Reset all statuses to disconnected on load
          return parsed.map((s: ServerConfig) => ({ ...s, status: 'disconnected' }))
        } catch {
          // Invalid data, start fresh
        }
      }
    }
    
    // Default servers
    return [
      {
        id: 'demo-1',
        name: 'Demo Server',
        url: 'wss://demo.quant.example.com',
        type: 'development',
        provider: 'aws',
        status: 'disconnected',
      },
      {
        id: 'local-1',
        name: 'Local Development',
        url: 'ws://localhost:8080',
        type: 'development',
        provider: 'localhost',
        status: 'disconnected',
      },
    ]
  })

  // Save to localStorage whenever servers change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quant-servers', JSON.stringify(servers))
    }
  }, [servers])

  const addServer = useCallback((serverData: Omit<ServerConfig, 'id' | 'status'>) => {
    const newServer: ServerConfig = {
      ...serverData,
      id: `server-${Date.now()}`,
      status: 'disconnected',
    }
    setServers(prev => [...prev, newServer])
    return newServer.id
  }, [])

  const removeServer = useCallback((id: string) => {
    setServers(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateServer = useCallback((id: string, updates: Partial<ServerConfig>) => {
    setServers(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ))
  }, [])

  const connectServer = useCallback(async (id: string) => {
    const server = servers.find(s => s.id === id)
    if (!server) return

    // Set connecting status
    updateServer(id, { status: 'connecting' })

    try {
      // Attempt connection
      const success = await mockConnectToServer(server.url, server.apiKey)
      
      if (success) {
        // Get initial metrics and stats
        const metrics = mockGetServerMetrics()
        const stats = mockGetTradingStats()
        
        updateServer(id, {
          status: 'connected',
          lastPing: new Date(),
          metrics,
          ...stats,
        })
        
        // Start periodic updates for connected server
        startMetricsUpdates(id)
      } else {
        updateServer(id, { status: 'error' })
      }
    } catch (error) {
      updateServer(id, { status: 'error' })
    }
  }, [servers])

  const disconnectServer = useCallback(async (id: string) => {
    updateServer(id, {
      status: 'disconnected',
      metrics: undefined,
      strategies: undefined,
      activeTrades: undefined,
      totalValue: undefined,
      pnl24h: undefined,
    })
    
    // Stop metrics updates
    stopMetricsUpdates(id)
  }, [])

  // Track intervals for metrics updates
  const metricsIntervals = new Map<string, NodeJS.Timeout>()

  const startMetricsUpdates = (id: string) => {
    // Clear any existing interval
    stopMetricsUpdates(id)
    
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      const server = servers.find(s => s.id === id)
      if (server?.status === 'connected') {
        const metrics = mockGetServerMetrics()
        const stats = mockGetTradingStats()
        
        updateServer(id, {
          lastPing: new Date(),
          metrics,
          ...stats,
        })
      } else {
        stopMetricsUpdates(id)
      }
    }, 5000)
    
    metricsIntervals.set(id, interval)
  }

  const stopMetricsUpdates = (id: string) => {
    const interval = metricsIntervals.get(id)
    if (interval) {
      clearInterval(interval)
      metricsIntervals.delete(id)
    }
  }

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      metricsIntervals.forEach(interval => clearInterval(interval))
    }
  }, [])

  // Auto-connect to servers marked as auto-connect
  useEffect(() => {
    servers.forEach(server => {
      if (server.status === 'disconnected' && server.type === 'production') {
        // Auto-connect production servers
        // connectServer(server.id)
      }
    })
  }, [])

  return {
    servers,
    addServer,
    removeServer,
    updateServer,
    connectServer,
    disconnectServer,
  }
}