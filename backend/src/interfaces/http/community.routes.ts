import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { ListCommunityMembersUseCase } from '../../app/use-cases/community/list-community-members.js';

const CommunityQuerySchema = z.object({
  interest: z.string().min(2).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export async function registerCommunityRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/', async (request) => {
    const query = CommunityQuerySchema.parse(request.query);
    const usecase = app.container.resolve<ListCommunityMembersUseCase>('usecase.community.listMembers');
    const { members, nextCursor } = await usecase.execute(query);
    return { members, nextCursor };
  });
}
