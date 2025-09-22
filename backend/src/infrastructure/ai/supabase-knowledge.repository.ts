import type { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeNode } from '../../domain/ai/knowledge.entity.js';

export interface KnowledgeSearchResult {
  nodes: KnowledgeNode[];
}

export class SupabaseKnowledgeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertNode(node: KnowledgeNode): Promise<void> {
    const payload = {
      id: node.id,
      source: node.source,
      title: node.title,
      summary: node.summary,
      metadata: node.metadata,
      created_at: node.createdAt.toISOString()
    };

    const { error } = await this.client
      .from('knowledge_nodes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to upsert knowledge node: ${error.message}`);
    }
  }

  async search(query: string, topK: number): Promise<KnowledgeNode[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      const { data, error } = await this.client
        .from('knowledge_nodes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(topK);

      if (error) {
        throw new Error(`Failed to fetch knowledge nodes: ${error.message}`);
      }

      return (data ?? []).map(mapRowToKnowledgeNode);
    }

    const escaped = trimmed.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const filter = `%${escaped}%`;

    const { data, error } = await this.client
      .from('knowledge_nodes')
      .select('*')
      .or(`summary.ilike.${filter},title.ilike.${filter}`)
      .order('created_at', { ascending: false })
      .limit(topK);

    if (error) {
      throw new Error(`Failed to search knowledge nodes: ${error.message}`);
    }

    return (data ?? []).map(mapRowToKnowledgeNode);
  }
}

function mapRowToKnowledgeNode(row: any): KnowledgeNode {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: row.created_at ? new Date(row.created_at) : new Date()
  };
}
