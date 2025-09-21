import type { KnowledgeNode } from '../../domain/ai/knowledge.entity.js';

export interface GraphClient {
  upsertNode(node: KnowledgeNode): Promise<void>;
  runCypher(query: string, params?: Record<string, unknown>): Promise<unknown>;
}

export class KagPipeline {
  constructor(private readonly graphClient: GraphClient) {}

  async ingest(node: KnowledgeNode): Promise<void> {
    await this.graphClient.upsertNode(node);
  }
}
