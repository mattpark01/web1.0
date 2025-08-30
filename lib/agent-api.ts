// Agent Runtime API Client
export interface CreateAgentRequest {
  agentId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxSteps?: number;
  allowedActions?: string[];
  requiresAuth?: boolean;
}

export interface Agent {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  icon?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxSteps: number;
  allowedActions: string[];
  requiresAuth: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PreconfiguredAgent {
  agentId: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  hasAllTools: boolean;
  toolCount: number;
}

export interface AgentRequest {
  agentId: string;
  goal: string;
  context?: Record<string, any>;
  availableTools?: any[];
  stream?: boolean;
  dryRun?: boolean;
}

export interface AgentResponse {
  executionId: string;
  status: string;
  plan?: any;
  streamUrl?: string;
}

export interface AgentStreamUpdate {
  executionId: string;
  type: string; // planning, plan_ready, step_start, step_complete, memory_update, completed, error, approval_required, auth_required, response
  stepNum?: number;
  step?: any;
  plan?: any;
  memory?: any;
  progress?: number;
  message?: string;
  data?: Record<string, any>;
  timestamp: string;
}

// Use relative URLs for client-side calls (proxied through Next.js API)
// This ensures the backend URL is never exposed to the client
const getAgentRuntimeUrl = () => {
  // For client-side, always use relative URLs (proxied)
  if (typeof window !== 'undefined') {
    return '';  // Empty string means relative URLs
  }
  
  // For server-side (if this is ever used server-side)
  return process.env.AGENT_RUNTIME_URL || 
         (process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : 'https://agent-runtime-565753126849.us-east1.run.app');
};

const AGENT_RUNTIME_BASE_URL = getAgentRuntimeUrl();

export class AgentAPI {
  private baseUrl: string;

  constructor(baseUrl: string = AGENT_RUNTIME_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    // Authentication is handled server-side via session cookies
    // No need for client-side API keys
    return {
      'Content-Type': 'application/json',
    };
  }

  async getAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.baseUrl}/api/agents`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get agents: ${response.statusText}`);
    }
    return response.json();
  }

  async getPreconfiguredAgents(): Promise<PreconfiguredAgent[]> {
    const response = await fetch(`${this.baseUrl}/api/agents/preconfigured`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get preconfigured agents: ${response.statusText}`);
    }
    return response.json();
  }

  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/api/agents`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agent: ${response.statusText}`);
    }

    return response.json();
  }

  async executeAgent(request: AgentRequest): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/api/agents/${request.agentId}/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute agent: ${response.statusText}`);
    }

    return response.json();
  }

  async streamAgentExecution(request: AgentRequest): Promise<ReadableStream<AgentStreamUpdate>> {
    const response = await fetch(`${this.baseUrl}/api/agents/${request.agentId}/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start agent stream: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    return new ReadableStream({
      start(controller) {
        const decoder = new TextDecoder();
        let buffer = '';

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const update: AgentStreamUpdate = JSON.parse(data);
                  controller.enqueue(update);
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }

            return pump();
          });
        }

        return pump();
      },
    });
  }

  async getExecution(executionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/executions/${executionId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get execution: ${response.statusText}`);
    }
    return response.json();
  }

  async cancelExecution(executionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/executions/${executionId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to cancel execution: ${response.statusText}`);
    }
  }
}

// Default instance
export const agentAPI = new AgentAPI();

// Hook for React components
export function useAgentAPI() {
  return agentAPI;
} 