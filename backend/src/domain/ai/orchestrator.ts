import type { RetrievalQuery, RetrievalResult, KnowledgeNode } from './knowledge.entity.js';

export interface AgentInvocation {
  id: string;
  agent: 'rag' | 'kag';
  query: string;
  userId?: string;
}

export interface AgentResponse {
  invocationId: string;
  output: string;
  citations: RetrievalResult[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgeIngestionJob {
  node: KnowledgeNode;
}

export interface AiOrchestrator {
  retrieve(query: RetrievalQuery): Promise<RetrievalResult[]>;
  executeAgent(invocation: AgentInvocation): Promise<AgentResponse>;
  ingest(job: KnowledgeIngestionJob): Promise<void>;
}
