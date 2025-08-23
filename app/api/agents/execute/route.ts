import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { AgentExecutor } from '@/services/agents/agent-executor';
import { z } from 'zod';

const executeSchema = z.object({
  agentId: z.string(),
  input: z.any().optional(),
  trigger: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = executeSchema.parse(body);

    const executor = new AgentExecutor();
    
    const result = await executor.execute({
      agentId: data.agentId,
      userId: user.id,
      input: data.input,
      trigger: data.trigger || 'manual',
    });

    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Agent execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent execution failed' },
      { status: 500 }
    );
  }
}