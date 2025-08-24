/**
 * Agent Executor Service
 * Manages agent execution lifecycle with Cloud Run and llm-api-service
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AgentExecutionConfig {
  agentId: string;
  userId: string;
  input?: any;
  trigger?: string;
}

interface LLMServiceRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export class AgentExecutor {
  private llmServiceUrl: string;

  constructor() {
    // Your existing llm-api-service URL
    this.llmServiceUrl = process.env.LLM_SERVICE_URL || 'https://llm-api-service-565733126845.us-east1.run.app';
  }

  /**
   * Execute an agent
   * For short tasks (<5 min): Direct execution
   * For long tasks: Cloud Run Job
   */
  async execute(config: AgentExecutionConfig) {
    const { agentId, userId, input, trigger } = config;

    // Get agent configuration
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check agent status
    if (!agent.isActive) {
      throw new Error('Agent is not active');
    }

    // Create execution record
    const execution = await prisma.agentExecution.create({
      data: {
        id: crypto.randomUUID(),
        agentId,
        userId,
        goal: input,
        status: 'executing',
        startedAt: new Date(),
      },
    });

    try {
      // Determine execution strategy based on agent configuration
      const agentConfig = {
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        temperature: agent.temperature,
        maxSteps: agent.maxSteps,
        allowedActions: agent.allowedActions,
        timeout: 60000, // Default timeout
      } as any;
      const isLongRunning = agentConfig.timeout > 300000; // > 5 minutes

      let result;
      if (isLongRunning) {
        result = await this.executeOnCloudRun(agent, execution.id, input);
      } else {
        result = await this.executeDirectly(agent, execution.id, input);
      }

      // Update execution with results
      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          result,
        },
      });

      // Update agent last run time
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Track usage
      await this.trackUsage(userId, agentId, execution.id);

      return result;
    } catch (error) {
      // Log error
      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Create alert for failure
      // TODO: Create alert when agent_alerts model is added
      // await prisma.agent_alerts.create({
      //   data: {
      //     id: crypto.randomUUID(),
      //     agent_id: agentId,
      //     user_id: userId,
      //     type: 'EXECUTION_FAILED',
      //     severity: 'HIGH',
      //     message: `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      //     metadata: { executionId: execution.id, error: String(error) },
      //   },
      // });

      throw error;
    }
  }

  /**
   * Execute agent directly (for short tasks)
   */
  private async executeDirectly(agent: any, executionId: string, input: any) {
    const agentConfig = agent.configuration as any;
    
    // Log start
    await this.logExecution(agent.id, executionId, 'INFO', 'Starting direct execution');

    // Prepare context for LLM
    const systemPrompt = this.buildSystemPrompt(agent, input);
    const userPrompt = this.buildUserPrompt(agent, input);

    // Call LLM service
    const llmRequest: LLMServiceRequest = {
      model: agentConfig.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: agentConfig.temperature || 0.7,
      max_tokens: agentConfig.max_tokens || 2000,
    };

    const startTime = Date.now();
    const response = await this.callLLMService(llmRequest, agent.user_id);
    const latency = Date.now() - startTime;

    // Track LLM usage
    await prisma.lLMRequest.create({
      data: {
        id: crypto.randomUUID(),
        userId: agent.user_id,
        model: llmRequest.model,
        provider: this.getProviderFromModel(llmRequest.model),
        messages: llmRequest.messages,
        response: response,
        latency,
        agentExecutionId: executionId,
        appContext: 'agent',
      },
    });

    // Process response based on agent type
    const result = await this.processAgentResponse(agent, response, input);

    // Log completion
    await this.logExecution(agent.id, executionId, 'INFO', 'Execution completed');

    return result;
  }

  /**
   * Execute agent on Cloud Run (for long tasks)
   */
  private async executeOnCloudRun(agent: any, executionId: string, input: any) {
    const agentConfig = agent.configuration as any;
    
    // Log start
    await this.logExecution(agent.id, executionId, 'INFO', 'Starting Cloud Run execution');

    // Create Cloud Run job configuration
    const jobConfig = {
      name: `agent-${agent.id}-${executionId}`,
      image: agentConfig.image || 'gcr.io/spatiolabs/agent-runtime:latest',
      env: {
        AGENT_ID: agent.id,
        EXECUTION_ID: executionId,
        LLM_SERVICE_URL: this.llmServiceUrl,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      timeout: agentConfig.timeout || 3600000, // Default 1 hour
      memory: agentConfig.memory || '512Mi',
      cpu: agentConfig.cpu || '1',
    };

    // Deploy and run the job
    const jobUrl = await this.deployCloudRunJob(jobConfig);

    // Update execution with Cloud Run details
    await prisma.agentExecution.update({
      where: { id: executionId },
      data: {
        result: {
          cloudRunJobUrl: jobUrl,
          status: 'Job submitted to Cloud Run',
        },
      },
    });

    // The Cloud Run job will update the execution record when complete
    return {
      executionId,
      cloudRunJobUrl: jobUrl,
      status: 'running',
      message: 'Agent is running on Cloud Run. Check execution status for updates.',
    };
  }

  /**
   * Call the LLM API service
   */
  private async callLLMService(request: LLMServiceRequest, userId: string): Promise<any> {
    const response = await fetch(this.llmServiceUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_SERVICE_API_KEY}`,
        'X-User-Id': userId,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LLM service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Build system prompt for agent
   */
  private buildSystemPrompt(agent: any, input: any): string {
    const config = agent.configuration as any;
    
    return `You are an AI agent named "${agent.name}".
    
Description: ${agent.description}

Configuration:
${JSON.stringify(config.settings || {}, null, 2)}

Available Data Access:
- User's notes, tasks, emails, calendar events
- Files and documents
- Banking and portfolio data (if authorized)
- External integrations (GitHub, Linear, etc.)

Instructions:
${config.instructions || 'Help the user with their request.'}

Output Format:
${config.outputFormat || 'Provide clear, structured responses.'}`;
  }

  /**
   * Build user prompt for agent
   */
  private buildUserPrompt(agent: any, input: any): string {
    if (typeof input === 'string') {
      return input;
    }
    
    return `Process the following input:
${JSON.stringify(input, null, 2)}`;
  }

  /**
   * Process agent response based on type
   */
  private async processAgentResponse(agent: any, response: any, input: any) {
    const config = agent.configuration as any;
    
    // Parse response based on agent type
    if (config.responseType === 'json') {
      try {
        return JSON.parse(response);
      } catch {
        return { content: response };
      }
    }
    
    // For action agents, execute the actions
    if (config.type === 'action') {
      return await this.executeAgentActions(agent, response, input);
    }
    
    return { content: response };
  }

  /**
   * Execute actions from agent response
   */
  private async executeAgentActions(agent: any, response: string, input: any) {
    // Parse actions from response
    const actionPattern = /ACTION:\s*(\w+)\((.*?)\)/g;
    const actions = [];
    let match;
    
    while ((match = actionPattern.exec(response)) !== null) {
      actions.push({
        action: match[1],
        params: match[2],
      });
    }
    
    const results = [];
    for (const action of actions) {
      const result = await this.executeAction(agent.user_id, action);
      results.push(result);
    }
    
    return {
      response,
      actions,
      results,
    };
  }

  /**
   * Execute a specific action
   */
  private async executeAction(userId: string, action: any) {
    switch (action.action) {
      case 'CREATE_NOTE':
        return await this.createNote(userId, JSON.parse(action.params));
      case 'CREATE_TASK':
        return await this.createTask(userId, JSON.parse(action.params));
      case 'SEND_EMAIL':
        return await this.sendEmail(userId, JSON.parse(action.params));
      default:
        return { error: `Unknown action: ${action.action}` };
    }
  }

  /**
   * Action: Create a note
   */
  private async createNote(userId: string, params: any) {
    const note = await prisma.note.create({
      data: {
        userId,
        title: params.title,
        content: params.content,
        contentType: 'MARKDOWN',
        tags: params.tags || [],
      },
    });
    
    return { action: 'CREATE_NOTE', noteId: note.id };
  }

  /**
   * Action: Create a task
   */
  private async createTask(userId: string, params: any) {
    const task = await prisma.task.create({
      data: {
        userId,
        title: params.title,
        description: params.description,
        status: 'TODO',
        priority: params.priority || 'MEDIUM',
        dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
      },
    });
    
    return { action: 'CREATE_TASK', taskId: task.id };
  }

  /**
   * Action: Send an email (queue for sending)
   */
  private async sendEmail(userId: string, params: any) {
    // Queue email for sending
    const email = await prisma.email.create({
      data: {
        userId,
        messageId: crypto.randomUUID(),
        from: params.from || 'user@spatiolabs.com',
        to: params.to,
        subject: params.subject,
        body: params.body,
        folder: 'DRAFTS',
        isDraft: true,
      },
    });
    
    return { action: 'SEND_EMAIL', emailId: email.id, status: 'queued' };
  }

  /**
   * Deploy Cloud Run job
   */
  private async deployCloudRunJob(config: any): Promise<string> {
    // This would use Google Cloud Run Jobs API
    // For now, return a mock URL
    const jobId = crypto.randomUUID();
    return `https://console.cloud.google.com/run/jobs/details/us-east1/agent-job-${jobId}`;
  }

  /**
   * Log execution details
   */
  private async logExecution(agentId: string, executionId: string, level: string, message: string) {
    // TODO: Create log when agent_logs model is added
    // await prisma.agent_logs.create({
    //   data: {
    //     id: crypto.randomUUID(),
    //     agent_id: agentId,
    //     execution_id: executionId,
    //     level: level as any,
    //     message,
    //     timestamp: new Date(),
    //   },
    // });
  }

  /**
   * Track agent usage
   */
  private async trackUsage(userId: string, agentId: string, executionId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // TODO: Track usage when agent_usage model is added
    // await prisma.agent_usage.upsert({
    //   where: {
    //     user_id_agent_id_date: {
    //       user_id: userId,
    //       agent_id: agentId,
    //       date: today,
    //     },
    //   },
    //   update: {
    //     execution_count: { increment: 1 },
    //   },
    //   create: {
    //     id: crypto.randomUUID(),
    //     user_id: userId,
    //     agent_id: agentId,
    //     date: today,
    //     execution_count: 1,
    //   },
    // });
  }

  /**
   * Get provider from model name
   */
  private getProviderFromModel(model: string): string {
    if (model.includes('gpt')) return 'openai';
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('gemini')) return 'google';
    return 'unknown';
  }
}