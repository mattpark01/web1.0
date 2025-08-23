"use client"

import { useState, useEffect } from "react"
import { useIntegrationManager } from "@/hooks/use-integration-manager"
import { Superellipse } from "@/components/ui/superellipse/superellipse"
import {
  Calendar,
  Mail,
  FileText,
  Github,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink,
  Loader2,
  Plug,
  PlugZap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

// Map providers to icons
const providerIcons: Record<string, any> = {
  'google-calendar': Calendar,
  'google-gmail': Mail,
  'github': Github,
  'notion': FileText,
  'plaid': DollarSign,
  'microsoft-outlook': Mail,
  'linear': CheckCircle,
}

interface IntegrationManagerProps {
  className?: string
}

export function IntegrationManager({ className }: IntegrationManagerProps) {
  const {
    integrations,
    loading,
    error,
    disconnectIntegration,
    reconnectIntegration,
    refreshIntegration,
    checkHealth,
  } = useIntegrationManager()

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Auto-check health of integrations on mount
  useEffect(() => {
    integrations.forEach(integration => {
      checkHealth(integration.id)
    })
  }, [integrations.length])

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return
    }

    setActionLoading(integrationId)
    const success = await disconnectIntegration(integrationId)
    setActionLoading(null)

    if (!success) {
      alert('Failed to disconnect integration')
    }
  }

  const handleReconnect = async (integrationId: string) => {
    setActionLoading(integrationId)
    const success = await reconnectIntegration(integrationId)
    setActionLoading(null)

    if (!success) {
      alert('Failed to reconnect. You may need to re-authenticate.')
    }
  }

  const handleRefresh = async (integrationId: string) => {
    setActionLoading(integrationId)
    const success = await refreshIntegration(integrationId)
    setActionLoading(null)

    if (!success) {
      alert('Failed to refresh token')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-500'
      case 'ERROR':
        return 'text-red-500'
      case 'EXPIRED':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />
      case 'ERROR':
        return <XCircle className="h-4 w-4" />
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("p-4 bg-red-50 dark:bg-red-900/20 rounded-lg", className)}>
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (integrations.length === 0) {
    return (
      <div className={cn("text-center p-8", className)}>
        <PlugZap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Connections</h3>
        <p className="text-muted-foreground">
          Browse the marketplace to connect your favorite services
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plug className="h-5 w-5" />
          Your Connections
        </h2>
        <span className="text-sm text-muted-foreground">
          {integrations.length} connected
        </span>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration) => {
          const Icon = providerIcons[integration.provider.toLowerCase().replace('_', '-')] || Plug
          const isLoading = actionLoading === integration.id

          return (
            <Superellipse
              key={integration.id}
              cornerRadius={12}
              cornerSmoothing={1}
            >
              <div className="p-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {integration.provider.replace('_', ' ')}
                        </h3>
                        <div className={cn("flex items-center gap-1", getStatusColor(integration.status))}>
                          {getStatusIcon(integration.status)}
                          <span className="text-xs">{integration.status}</span>
                        </div>
                      </div>
                      
                      {integration.accountEmail && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {integration.accountEmail}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {integration.lastSyncedAt && (
                          <span>
                            Last synced: {formatDistanceToNow(new Date(integration.lastSyncedAt), { addSuffix: true })}
                          </span>
                        )}
                        {integration.scopes && integration.scopes.length > 0 && (
                          <span>{integration.scopes.length} permissions</span>
                        )}
                        {integration.apiCallCount > 0 && (
                          <span>{integration.apiCallCount} API calls</span>
                        )}
                      </div>

                      {integration.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          {integration.errorMessage}
                        </div>
                      )}

                      {integration.health?.needsReauth && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
                          Re-authentication required
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {integration.status === 'EXPIRED' && (
                          <button
                            onClick={() => handleRefresh(integration.id)}
                            className="p-1.5 hover:bg-muted/20 rounded transition-colors"
                            title="Refresh token"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        
                        {(integration.status === 'ERROR' || integration.status === 'REVOKED') && (
                          <button
                            onClick={() => handleReconnect(integration.id)}
                            className="p-1.5 hover:bg-muted/20 rounded transition-colors"
                            title="Reconnect"
                          >
                            <PlugZap className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedIntegration(
                            selectedIntegration === integration.id ? null : integration.id
                          )}
                          className="p-1.5 hover:bg-muted/20 rounded transition-colors"
                          title="Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-500"
                          title="Disconnect"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedIntegration === integration.id && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Integration ID:</span>
                        <p className="font-mono">{integration.id.slice(0, 8)}...</p>
                      </div>
                      {integration.accountId && (
                        <div>
                          <span className="text-muted-foreground">Account ID:</span>
                          <p className="font-mono">{integration.accountId.slice(0, 8)}...</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Sync Enabled:</span>
                        <p>{integration.syncEnabled ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Error Count:</span>
                        <p>{integration.errorCount || 0}</p>
                      </div>
                    </div>

                    {integration.scopes && integration.scopes.length > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Permissions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {integration.scopes.slice(0, 5).map((scope, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-muted/20 rounded text-xs"
                            >
                              {scope.split('/').pop()?.replace('.', ' ')}
                            </span>
                          ))}
                          {integration.scopes.length > 5 && (
                            <span className="px-2 py-1 text-xs text-muted-foreground">
                              +{integration.scopes.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Superellipse>
          )
        })}
      </div>
    </div>
  )
}