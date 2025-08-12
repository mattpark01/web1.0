"use client";

import { useState, useEffect, useCallback } from "react";
import { agentRuntimeAPI, Integration, MarketplaceFilters } from "@/lib/agent-runtime-api";

export function useIntegrations(filters?: MarketplaceFilters) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentRuntimeAPI.getIntegrations(filters);
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const installIntegration = async (integrationId: string) => {
    try {
      const response = await agentRuntimeAPI.installIntegration({
        integrationId,
      });
      
      // Handle OAuth flow
      if (response.authUrl) {
        window.open(response.authUrl, "_blank");
      }
      
      // Update local state
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, isInstalled: true, installedAt: new Date().toISOString() }
            : i
        )
      );
      
      return response;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to install integration");
    }
  };

  const uninstallIntegration = async (integrationId: string) => {
    try {
      await agentRuntimeAPI.uninstallIntegration(integrationId);
      
      // Update local state
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, isInstalled: false, installedAt: undefined }
            : i
        )
      );
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to uninstall integration");
    }
  };

  const toggleFavorite = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    const newFavoriteState = !integration.isFavorite;

    try {
      await agentRuntimeAPI.toggleFavorite(integrationId, newFavoriteState);
      
      // Update local state
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integrationId 
            ? { ...i, isFavorite: newFavoriteState }
            : i
        )
      );
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to toggle favorite");
    }
  };

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    installIntegration,
    uninstallIntegration,
    toggleFavorite,
  };
}