"use client";

import { useState, useEffect, useCallback } from "react";

export interface InstalledIntegration {
  id: string;
  provider: string;
  status: string;
  accountEmail?: string;
  accountId?: string;
  scopes?: string[];
  syncEnabled: boolean;
  lastSyncedAt?: Date;
  errorMessage?: string;
  errorCount: number;
  lastUsedAt?: Date;
  apiCallCount: number;
  createdAt: Date;
  updatedAt: Date;
  health?: {
    isHealthy: boolean;
    needsReauth: boolean;
    lastCheck: Date;
  };
}

export function useIntegrationManager() {
  const [integrations, setIntegrations] = useState<InstalledIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/integrations/installed');
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const disconnectIntegration = async (integrationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }
      
      // Update local state
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      return false;
    }
  };

  const reconnectIntegration = async (integrationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/reconnect`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reconnect integration');
      }
      
      const data = await response.json();
      
      // Handle OAuth redirect if needed
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
      
      // Refresh integrations
      await fetchIntegrations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconnect');
      return false;
    }
  };

  const refreshIntegration = async (integrationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/refresh`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      // Refresh integrations
      await fetchIntegrations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
      return false;
    }
  };

  const checkHealth = async (integrationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/health`);
      
      if (!response.ok) {
        return;
      }
      
      const health = await response.json();
      
      // Update local state with health info
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, health }
          : i
      ));
    } catch {
      // Silently fail health checks
    }
  };

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    disconnectIntegration,
    reconnectIntegration,
    refreshIntegration,
    checkHealth,
  };
}