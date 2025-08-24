// Agent Runtime API Client
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

const AGENT_RUNTIME_BASE_URL = process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL || 'http://localhost:8080';

export class AgentAPI {
  private baseUrl: string;

  constructor(baseUrl: string = AGENT_RUNTIME_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getAgents(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/agents`);
    if (!response.ok) {
      throw new Error(`Failed to get agents: ${response.statusText}`);
    }
    return response.json();
  }

  async executeAgent(request: AgentRequest): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/api/agents/${request.agentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${this.baseUrl}/api/executions/${executionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get execution: ${response.statusText}`);
    }
    return response.json();
  }

  async cancelExecution(executionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/executions/${executionId}/cancel`, {
      method: 'POST',
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