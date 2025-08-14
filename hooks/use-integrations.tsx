"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { agentRuntimeAPI, Integration, MarketplaceFilters } from "@/lib/agent-runtime-api";
import { memoryCache, localStorageCache, ImagePreloader } from "@/lib/cache";

// Generate cache key from filters
function getCacheKey(filters?: MarketplaceFilters): string {
  if (!filters) return 'integrations_all';
  
  const parts = [
    'integrations',
    filters.platform || 'all',
    filters.category || 'all',
    filters.searchTerm || '',
    filters.sortBy || 'popular',
    filters.pricingType || '',
    filters.tags?.join(',') || '',
  ];
  
  return parts.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function useIntegrations(filters?: MarketplaceFilters) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const cacheKey = useMemo(() => getCacheKey(filters), [
    filters?.platform,
    filters?.category,
    filters?.searchTerm,
    filters?.sortBy,
    filters?.pricingType,
    filters?.tags?.join(',')
  ]);

  const fetchIntegrations = useCallback(async () => {
    try {
      // Check memory cache first
      const memCached = memoryCache.get<Integration[]>(cacheKey);
      if (memCached) {
        setIntegrations(memCached);
        setLoading(false);
        
        // Preload images in the background
        const imageUrls = memCached
          .map(i => i.iconUrl)
          .filter((url): url is string => !!url);
        ImagePreloader.preload(imageUrls);
        
        return;
      }
      
      // Check localStorage cache
      const localCached = localStorageCache.get<Integration[]>(cacheKey);
      if (localCached) {
        setIntegrations(localCached);
        memoryCache.set(cacheKey, localCached, 5 * 60 * 1000); // 5 minutes
        setLoading(false);
        
        // Preload images in the background
        const imageUrls = localCached
          .map(i => i.iconUrl)
          .filter((url): url is string => !!url);
        ImagePreloader.preload(imageUrls);
        
        return;
      }
      
      // No cache hit, fetch from API
      setLoading(true);
      setError(null);
      const data = await agentRuntimeAPI.getIntegrations(filters);
      
      // Cache the results
      memoryCache.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
      localStorageCache.set(cacheKey, data, 30 * 60 * 1000); // 30 minutes
      
      setIntegrations(data);
      
      // Preload all logo images
      const imageUrls = data
        .map(i => i.iconUrl)
        .filter((url): url is string => !!url);
      ImagePreloader.preload(imageUrls);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, filters]);

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
        // Open OAuth popup
        const popup = window.open(response.authUrl, 'oauth', 'width=600,height=700');
        
        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'oauth-success' && event.data.integration === integrationId) {
            window.removeEventListener('message', handleMessage);
            popup?.close();
            
            // Update local state
            setIntegrations(prev => 
              prev.map(i => 
                i.id === integrationId 
                  ? { ...i, isInstalled: true, installedAt: new Date().toISOString() }
                  : i
              )
            );
            
            // Clear cache to reflect changes
            memoryCache.delete(cacheKey);
            localStorageCache.delete(cacheKey);
            
            // Refetch to get latest data
            fetchIntegrations();
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Clean up listener if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
          }
        }, 1000);
      } else {
        // No OAuth needed, mark as installed
        setIntegrations(prev => 
          prev.map(i => 
            i.id === integrationId 
              ? { ...i, isInstalled: true, installedAt: new Date().toISOString() }
              : i
          )
        );
        
        // Clear cache to reflect changes
        memoryCache.delete(cacheKey);
        localStorageCache.delete(cacheKey);
      }
      
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
      
      // Clear cache to reflect changes
      memoryCache.delete(cacheKey);
      localStorageCache.delete(cacheKey);
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
      
      // Clear cache to reflect changes
      memoryCache.delete(cacheKey);
      localStorageCache.delete(cacheKey);
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