// Agent Runtime API Client
// This client communicates with the agent-runtime Go backend

const AGENT_RUNTIME_URL = process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL || 'http://localhost:8081';

export interface IntegrationPermission {
  id: string;
  name: string;
  description: string;
  category: 'read' | 'write' | 'delete' | 'admin';
  required: boolean;
}

export interface Integration {
  id: string;
  platformId: string;
  provider: string;
  name: string;
  description: string;
  icon: string;
  iconUrl?: string;
  category: string;
  authType: 'oauth2' | 'api_key' | 'none';
  requiredScopes?: string[];
  permissions?: IntegrationPermission[];
  dataAccess?: {
    read: string[];
    write: string[];
    delete?: string[];
  };
  tags: string[];
  pricingType: 'free' | 'paid' | 'freemium';
  pricingDetails?: string;
  documentationUrl?: string;
  websiteUrl?: string;
  supportUrl?: string;
  capabilities: string[];
  status: 'available' | 'beta' | 'deprecated';
  averageRating?: number;
  reviewCount: number;
  installCount: number;
  version: string;
  lastUpdated: string;
  isInstalled?: boolean;
  installedAt?: string;
  isFavorite?: boolean;
}

export interface AppPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  integrationCount?: number;
}

export interface MarketplaceFilters {
  platform?: string;
  category?: string;
  tags?: string[];
  searchTerm?: string;
  pricingType?: string;
  sortBy?: 'popular' | 'rating' | 'newest' | 'name';
  limit?: number;
  offset?: number;
}

export interface InstallationRequest {
  integrationId: string;
  settings?: Record<string, any>;
}

export interface InstallationResponse {
  installationId: string;
  status: 'pending' | 'active' | 'failed';
  authUrl?: string;
  requiresApiKey?: boolean;
  nextSteps?: string;
}

export interface ActionDefinition {
  id: string;
  actionId: string;
  platform: string;
  provider: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  shortcut?: string;
  executionType: 'direct' | 'agentic';
  requiresAuth: boolean;
  requiresLLM: boolean;
  agenticConfig?: {
    requiresPlanning: boolean;
    requiresConfirmation: boolean;
    maxSteps: number;
    systemPrompt: string;
  };
  inputSchema?: any;
  outputSchema?: any;
  isActive: boolean;
}

class AgentRuntimeAPI {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = AGENT_RUNTIME_URL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  // Set user token for authenticated requests
  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Get current user ID (mock for now)
  private getUserId(): string {
    // In a real app, this would come from auth context
    return 'user-123';
  }

  // Marketplace endpoints
  async getIntegrations(filters?: MarketplaceFilters): Promise<Integration[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.category) params.append('category', filters.category);
      if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.pricingType) params.append('pricing', filters.pricingType);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
    }

    // Use local web1.0 API instead of agent-runtime for connections
    const response = await fetch(
      `/api/connections/integrations?${params.toString()}`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch integrations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.integrations || [];
  }

  async getIntegration(integrationId: string): Promise<Integration> {
    const response = await fetch(
      `${this.baseUrl}/api/connections/integrations/${integrationId}`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch integration: ${response.statusText}`);
    }

    return response.json();
  }

  async getPlatforms(): Promise<AppPlatform[]> {
    // Use local web1.0 API instead of agent-runtime for platforms
    const response = await fetch(
      `/api/platforms`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch platforms: ${response.statusText}`);
    }

    return response.json();
  }

  // Installation endpoints
  async installIntegration(request: InstallationRequest): Promise<InstallationResponse> {
    const response = await fetch(
      `/api/connections/integrations/${request.integrationId}/install`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          settings: request.settings,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to install integration: ${response.statusText}`);
    }

    return response.json();
  }

  async uninstallIntegration(integrationId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/integrations/${integrationId}/uninstall`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          userId: this.getUserId(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to uninstall integration: ${response.statusText}`);
    }
  }

  async completeOAuthFlow(installationId: string, code: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/integrations/oauth/callback`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          installationId,
          code,
          userId: this.getUserId(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to complete OAuth flow: ${response.statusText}`);
    }
  }

  async provideApiKey(integrationId: string, apiKey: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/integrations/${integrationId}/configure`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          apiKey,
          userId: this.getUserId(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to configure API key: ${response.statusText}`);
    }
  }

  // Actions endpoints
  async getActions(platformId?: string): Promise<ActionDefinition[]> {
    const params = platformId ? `?platform=${platformId}` : '';
    const response = await fetch(
      `${this.baseUrl}/api/actions${params}`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch actions: ${response.statusText}`);
    }

    return response.json();
  }

  async executeAction(actionId: string, input?: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/actions/${actionId}/execute`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          input,
          userId: this.getUserId(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to execute action: ${response.statusText}`);
    }

    return response.json();
  }

  // User installations
  async getUserInstallations(): Promise<Integration[]> {
    const response = await fetch(
      `${this.baseUrl}/api/users/${this.getUserId()}/installations`,
      {
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user installations: ${response.statusText}`);
    }

    return response.json();
  }

  async toggleFavorite(integrationId: string, isFavorite: boolean): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/integrations/${integrationId}/favorite`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          isFavorite,
          userId: this.getUserId(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }
  }
}

// Export singleton instance
export const agentRuntimeAPI = new AgentRuntimeAPI();