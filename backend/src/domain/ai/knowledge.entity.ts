export interface KnowledgeNode {
  id: string;
  source: 'post' | 'comment' | 'external';
  title: string;
  summary: string;
  embeddingId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface RetrievalQuery {
  query: string;
  userId?: string;
  interests?: string[];
  topK?: number;
}

export interface RetrievalResult {
  node: KnowledgeNode;
  relevance: number;
  highlights?: string[];
}
