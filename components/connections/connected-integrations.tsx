"use client";

import { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  RefreshCw, 
  Settings, 
  Trash2, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Key,
  Calendar,
  Mail,
  Github,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectedIntegration {
  id: string;
  providerId: string;
  name: string;
  icon?: string;
  accountEmail?: string;
  status: 'active' | 'expired' | 'error';
  connectedAt: string;
  lastSyncedAt?: string;
  error?: string;
}

export function ConnectedIntegrations() {
  const [connections, setConnections] = useState<ConnectedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections/user');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    try {
      const response = await fetch(`/api/connections/${connectionId}/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        setConnections(prev => prev.filter(c => c.id !== connectionId));
      } else {
        alert('Failed to disconnect integration');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect integration');
    }
  };

  const handleRefresh = async (connectionId: string) => {
    setRefreshing(connectionId);
    
    try {
      const response = await fetch(`/api/connections/${connectionId}/refresh`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchConnections();
      } else {
        alert('Failed to refresh connection');
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      alert('Failed to refresh connection');
    } finally {
      setRefreshing(null);
    }
  };

  const getProviderIcon = (providerId: string) => {
    const icons: Record<string, any> = {
      'google-calendar': Calendar,
      'gmail': Mail,
      'github': Github,
      'linear': FileText,
      // Add more as needed
    };
    return icons[providerId] || Settings;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'expired':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      case 'error':
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No connections yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your first integration from the marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Connected Integrations</h2>
        <span className="text-sm text-muted-foreground">
          {connections.length} connected
        </span>
      </div>

      <div className="grid gap-4">
        {connections.map((connection) => {
          const Icon = getProviderIcon(connection.providerId);
          
          return (
            <div
              key={connection.id}
              className="p-4 bg-muted/10 rounded-lg border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted/20 rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{connection.name}</h3>
                      <div className={cn(
                        "flex items-center gap-1",
                        getStatusColor(connection.status)
                      )}>
                        {getStatusIcon(connection.status)}
                        <span className="text-xs capitalize">
                          {connection.status}
                        </span>
                      </div>
                    </div>
                    
                    {connection.accountEmail && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {connection.accountEmail}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Connected {new Date(connection.connectedAt).toLocaleDateString()}
                      </span>
                      {connection.lastSyncedAt && (
                        <span>
                          Last synced {new Date(connection.lastSyncedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {connection.error && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                        {connection.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRefresh(connection.id)}
                    disabled={refreshing === connection.id}
                    className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                    title="Refresh connection"
                  >
                    {refreshing === connection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}