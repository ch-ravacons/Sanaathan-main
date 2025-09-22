import { RagPipeline } from '../../ai/pipelines/rag-pipeline.js';
import { KagPipeline } from '../../ai/pipelines/kag-pipeline.js';
import type { KnowledgeNode, RetrievalQuery, RetrievalResult } from '../../domain/ai/knowledge.entity.js';
import type { AiOrchestrator, AgentInvocation, AgentResponse, KnowledgeIngestionJob } from '../../domain/ai/orchestrator.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseKnowledgeRepository } from './supabase-knowledge.repository.js';

export interface SupabaseAiOrchestratorOptions {
  supabaseClient: SupabaseClient;
}

export class SupabaseAiOrchestrator implements AiOrchestrator {
  private readonly knowledgeRepo: SupabaseKnowledgeRepository;
  private readonly rag: RagPipeline;
  private readonly kag: KagPipeline;

  constructor(private readonly options: SupabaseAiOrchestratorOptions) {
    this.knowledgeRepo = new SupabaseKnowledgeRepository(options.supabaseClient);
    this.rag = new RagPipeline({
      vectorSearch: async (text, topK) => {
        const nodes = await this.knowledgeRepo.search(text, topK);
        return nodes.map((node, index) => ({
          node,
          relevance: 1 - index * 0.1,
          highlights: []
        }));
      }
    });
    this.kag = new KagPipeline({
      upsertNode: async (node: KnowledgeNode) => {
        await this.knowledgeRepo.upsertNode(node);
      },
      runCypher: async () => {
        return undefined;
      }
    });
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    return this.rag.run(query);
  }

  async executeAgent(invocation: AgentInvocation): Promise<AgentResponse> {
    const contextTopK =
      invocation.context && typeof (invocation.context as Record<string, unknown>).topK === 'number'
        ? (invocation.context as Record<string, unknown>).topK as number
        : undefined;

    const results = await this.retrieve({
      query: invocation.query,
      topK: contextTopK ?? 5
    });

    const summary = buildGuidanceSummary(invocation, results);

    return {
      invocationId: invocation.id,
      output: summary,
      citations: results,
      metadata: {
        agent: invocation.agent,
        context: invocation.context ?? null
      }
    };
  }

  async ingest(job: KnowledgeIngestionJob): Promise<void> {
    await this.kag.ingest(job.node);
  }
}

function buildGuidanceSummary(invocation: AgentInvocation, results: RetrievalResult[]): string {
  if (!results.length) {
    return `I do not have any stored insights for “${invocation.query}” yet. Try refining your question or share knowledge with the community.`;
  }

  const bulletPoints = results.map((result) => `• ${result.node.title}: ${result.node.summary}`);

  const intro = invocation.agent === 'guidance'
    ? `Here are some guidance highlights for “${invocation.query}” based on community wisdom:`
    : `Related knowledge for “${invocation.query}”:`;

  return `${intro}\n${bulletPoints.join('\n')}`;
}
