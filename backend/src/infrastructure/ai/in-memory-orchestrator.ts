import type {
  AiOrchestrator,
  AgentInvocation,
  AgentResponse,
  KnowledgeIngestionJob
} from '../../domain/ai/orchestrator.js';
import type { RetrievalQuery, RetrievalResult } from '../../domain/ai/knowledge.entity.js';

export class InMemoryAiOrchestrator implements AiOrchestrator {
  private readonly knowledge: KnowledgeIngestionJob[] = [];

  // TODO: swap in actual RagPipeline/KagPipeline implementations wired to vector DB + graph DB

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    const matches = this.knowledge.filter((entry) =>
      entry.node.summary.toLowerCase().includes((query.query ?? '').toLowerCase()),
    );

    return matches.slice(0, query.topK ?? 5).map((entry, index) => ({
      node: entry.node,
      relevance: 1 - index * 0.1,
      highlights: []
    }));
  }

  async executeAgent(invocation: AgentInvocation): Promise<AgentResponse> {
    const retrieved = await this.retrieve({ query: invocation.query, topK: 5 });

    const combinedText = retrieved.map((r) => r.node.summary).join('\n\n');
    const output = combinedText
      ? `Synthesized insights for "${invocation.query}":\n${combinedText}`
      : `No knowledge available yet for "${invocation.query}".`;

    return {
      invocationId: invocation.id,
      output,
      citations: retrieved,
      metadata: {
        agent: invocation.agent
      }
    };
  }

  async ingest(job: KnowledgeIngestionJob): Promise<void> {
    this.knowledge.unshift(job);
  }
}
