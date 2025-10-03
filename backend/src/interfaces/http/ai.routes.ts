import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { AskAgentUseCase } from '../../app/use-cases/ai/ask-agent.js';

const AskAgentSchema = z.object({
  agent: z.enum(['rag', 'kag', 'guidance']).default('rag'),
  query: z.string().min(3),
  userId: z.string().uuid().optional(),
  context: z.record(z.unknown()).optional()
});

export async function registerAiRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.post('/ask', async (request) => {
    const payload = AskAgentSchema.parse(request.body);
    const usecase = app.container.resolve<AskAgentUseCase>('usecase.ai.askAgent');
    const response = await usecase.execute(payload);

    const sources = (response.citations ?? []).map((citation) => {
      const title = citation.node.title ?? 'Community insight';
      const snippet = citation.node.summary ?? undefined;
      const candidateUrl =
        typeof citation.node.metadata?.url === 'string' ? citation.node.metadata.url : undefined;
      const url = candidateUrl && /^https?:\/\//i.test(candidateUrl)
        ? candidateUrl
        : `https://sanaathan.community/knowledge/${citation.node.id}`;
      return {
        title,
        url,
        snippet
      };
    });

    return {
      message: response.output,
      sources,
      metadata: response.metadata ?? {}
    };
  });
}
