import { randomUUID } from 'node:crypto';

import type { AiOrchestrator, AgentInvocation, AgentResponse } from '../../../domain/ai/orchestrator.js';

export interface AskAgentInput {
  agent: 'rag' | 'kag' | 'guidance';
  query: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export class AskAgentUseCase {
  constructor(private readonly orchestrator: AiOrchestrator) {}

  execute(input: AskAgentInput): Promise<AgentResponse> {
    const invocation: AgentInvocation = {
      id: randomUUID(),
      agent: input.agent,
      query: input.query,
      userId: input.userId,
      context: input.context
    };

    return this.orchestrator.executeAgent(invocation);
  }
}
