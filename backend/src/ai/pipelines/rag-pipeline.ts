import type { RetrievalQuery, RetrievalResult } from '../../domain/ai/knowledge.entity.js';

export interface RagPipelineDependencies {
  vectorSearch: (query: string, topK: number) => Promise<RetrievalResult[]>;
  rerank?: (results: RetrievalResult[], query: string) => Promise<RetrievalResult[]>;
}

export class RagPipeline {
  constructor(private readonly deps: RagPipelineDependencies) {}

  async run(query: RetrievalQuery): Promise<RetrievalResult[]> {
    const vectorResults = await this.deps.vectorSearch(query.query, query.topK ?? 5);
    if (!this.deps.rerank) {
      return vectorResults;
    }
    return this.deps.rerank(vectorResults, query.query);
  }
}
