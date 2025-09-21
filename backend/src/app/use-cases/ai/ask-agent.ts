import { randomUUID } from 'node:crypto';

import type { AiOrchestrator, AgentInvocation, AgentResponse } from '../../../domain/ai/orchestrator.js';

export interface AskAgentInput {
  agent: 'rag' | 'kag';
  query: string;
  userId?: string;
}

export class AskAgentUseCase {
  constructor(private readonly orchestrator: AiOrchestrator) {}

  execute(input: AskAgentInput): Promise<AgentResponse> {
    const invocation: AgentInvocation = {
      id: randomUUID(),
      agent: input.agent,
      query: input.query,
      userId: input.userId
    };

    return this.orchestrator.executeAgent(invocation);
  }
}
