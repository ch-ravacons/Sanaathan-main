import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { InMemoryAiOrchestrator } from '../src/infrastructure/ai/in-memory-orchestrator.js';
import type { KnowledgeNode } from '../src/domain/ai/knowledge.entity.js';

function makeNode(overrides: Partial<KnowledgeNode> = {}): KnowledgeNode {
  return {
    id: randomUUID(),
    source: overrides.source ?? 'post',
    title: overrides.title ?? 'Meditation Insight',
    summary: overrides.summary ?? 'Meditation helps calm the mind and connect with the inner self.',
    metadata: overrides.metadata ?? {},
    createdAt: overrides.createdAt ?? new Date(),
    embeddingId: overrides.embeddingId
  };
}

test('guidance agent returns synthesized insights when knowledge exists', async () => {
  const orchestrator = new InMemoryAiOrchestrator();
  await orchestrator.ingest({ node: makeNode({ summary: 'Bhakti yoga cultivates love through chanting.' }) });

  const response = await orchestrator.executeAgent({
    id: randomUUID(),
    agent: 'guidance',
    query: 'bhakti',
    context: {}
  });

  assert.equal(response.metadata?.agent, 'guidance');
  assert.ok(response.output.toLowerCase().includes('bhakti'), 'Output should include knowledge summary');
  assert.ok(response.citations.length > 0, 'Citations should reference stored knowledge');
});

test('guidance agent provides fallback message when knowledge is empty', async () => {
  const orchestrator = new InMemoryAiOrchestrator();

  const response = await orchestrator.executeAgent({
    id: randomUUID(),
    agent: 'guidance',
    query: 'unknown topic',
    context: {}
  });

  assert.match(response.output, /no knowledge available yet/i);
  assert.equal(response.citations.length, 0);
});
