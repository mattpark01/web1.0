"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Superellipse } from '@/components/ui/superellipse/superellipse'
import {
  Server,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  RefreshCw,
  Globe,
  Lock,
  Zap,
  Database,
  Cloud,
  Terminal,
  Cpu,
  HardDrive,
  Network,
  Shield,
} from 'lucide-react'

export interface ServerConfig {
  id: string
  name: string
  url: string
  apiKey?: string
  type: 'production' | 'staging' | 'development' | 'custom'
  provider?: 'aws' | 'gcp' | 'azure' | 'self-hosted' | 'localhost'
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastPing?: Date
  metrics?: {
    cpu: number
    memory: number
    latency: number
    uptime: number
  }
  strategies?: number
  activeTrades?: number
  totalValue?: number
  pnl24h?: number
}

interface ServerConnectionProps {
  servers: ServerConfig[]
  onAddServer: (server: Omit<ServerConfig, 'id' | 'status'>) => void
  onRemoveServer: (id: string) => void
  onUpdateServer: (id: string, updates: Partial<ServerConfig>) => void
  onConnect: (id: string) => Promise<void>
  onDisconnect: (id: string) => Promise<void>
}

export function ServerConnection({
  servers,
  onAddServer,
  onRemoveServer,
  onUpdateServer,
  onConnect,
  onDisconnect,
}: ServerConnectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<ServerConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKey: '',
    type: 'custom' as const,
    provider: 'self-hosted' as const,
  })

  const handleAddServer = () => {
    setEditingServer(null)
    setFormData({
      name: '',
      url: '',
      apiKey: '',
      type: 'custom',
      provider: 'self-hosted',
    })
    setDialogOpen(true)
  }

  const handleEditServer = (server: ServerConfig) => {
    setEditingServer(server)
    setFormData({
      name: server.name,
      url: server.url,
      apiKey: server.apiKey || '',
      type: server.type,
      provider: server.provider || 'self-hosted',
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingServer) {
      onUpdateServer(editingServer.id, formData)
    } else {
      onAddServer(formData)
    }
    setDialogOpen(false)
  }

  const getStatusColor = (status: ServerConfig['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getProviderIcon = (provider?: ServerConfig['provider']) => {
    switch (provider) {
      case 'aws':
        return Cloud
      case 'gcp':
        return Database
      case 'azure':
        return Cloud
      case 'localhost':
        return Terminal
      default:
        return Server
    }
  }

  return (
    <>
      {/* Server Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => {
          const ProviderIcon = getProviderIcon(server.provider)
          
          return (
            <Superellipse
              key={server.id}
              className="bg-white/[0.025] dark:bg-white/[0.025] relative group"
              cornerRadius={12}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-foreground/5">
                      <ProviderIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{server.name}</h3>
                      <p className="text-xs text-muted-foreground">{server.url}</p>
                    </div>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(server.status)}`} />
                </div>

                {/* Metrics */}
                {server.status === 'connected' && server.metrics && (
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Cpu className="h-3 w-3" />
                          CPU
                        </div>
                        <div className="font-medium">{server.metrics.cpu}%</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <HardDrive className="h-3 w-3" />
                          Memory
                        </div>
                        <div className="font-medium">{server.metrics.memory}%</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Network className="h-3 w-3" />
                          Latency
                        </div>
                        <div className="font-medium">{server.metrics.latency}ms</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Activity className="h-3 w-3" />
                          Uptime
                        </div>
                        <div className="font-medium">{server.metrics.uptime}%</div>
                      </div>
                    </div>

                    {/* Trading Stats */}
                    {(server.strategies || server.activeTrades) && (
                      <div className="pt-3 border-t border-border">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {server.strategies !== undefined && (
                            <div>
                              <div className="text-muted-foreground mb-1">Strategies</div>
                              <div className="font-medium text-sm">{server.strategies}</div>
                            </div>
                          )}
                          {server.activeTrades !== undefined && (
                            <div>
                              <div className="text-muted-foreground mb-1">Active Trades</div>
                              <div className="font-medium text-sm">{server.activeTrades}</div>
                            </div>
                          )}
                        </div>
                        {server.pnl24h !== undefined && (
                          <div className="mt-3">
                            <div className="text-xs text-muted-foreground mb-1">24h P&L</div>
                            <div className={`font-semibold text-sm ${server.pnl24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {server.pnl24h >= 0 ? '+' : ''}{server.pnl24h.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Message */}
                {server.status === 'error' && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    Connection failed
                  </div>
                )}

                {server.status === 'connecting' && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-yellow-500">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Connecting...
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {server.status === 'disconnected' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onConnect(server.id)}
                    >
                      Connect
                    </Button>
                  )}
                  {server.status === 'connected' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onDisconnect(server.id)}
                    >
                      Disconnect
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditServer(server)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onRemoveServer(server.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-[10px] border-0">
                    {server.type}
                  </Badge>
                </div>
              </div>
            </Superellipse>
          )
        })}

        {/* Add Server Card */}
        <Superellipse
          className="bg-white/[0.025] dark:bg-white/[0.025] border-2 border-dashed border-border hover:border-foreground/20 transition-colors cursor-pointer"
          cornerRadius={12}
          onClick={handleAddServer}
        >
          <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
            <div className="p-3 rounded-full bg-foreground/5 mb-3">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Add Server</h3>
            <p className="text-xs text-muted-foreground text-center">
              Connect to a trading server
            </p>
          </div>
        </Superellipse>
      </div>

      {/* Add/Edit Server Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingServer ? 'Edit Server' : 'Add Trading Server'}
            </DialogTitle>
            <DialogDescription>
              Configure your trading server connection details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Server Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="My Trading Server"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Server URL</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="https://api.example.com or ws://localhost:8080"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">API Key (Optional)</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="Your API key for authentication"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Environment</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ServerConfig['type'] })}
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Provider</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as ServerConfig['provider'] })}
                >
                  <option value="self-hosted">Self Hosted</option>
                  <option value="aws">AWS</option>
                  <option value="gcp">Google Cloud</option>
                  <option value="azure">Azure</option>
                  <option value="localhost">Localhost</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingServer ? 'Update' : 'Add'} Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}