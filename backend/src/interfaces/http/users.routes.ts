import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { ListSuggestedConnectionsUseCase } from '../../app/use-cases/users/list-suggested-connections.js';
import type { FollowUserUseCase } from '../../app/use-cases/users/follow-user.js';
import type { UnfollowUserUseCase } from '../../app/use-cases/users/unfollow-user.js';

const SuggestionQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional()
});

const FollowParamsSchema = z.object({ userId: z.string().uuid() });
const FollowBodySchema = z.object({ followerId: z.string().uuid() });
const FollowQuerySchema = z.object({ followerId: z.string().uuid().optional() });

export async function registerUserRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/suggestions', async (request) => {
    const query = SuggestionQuerySchema.parse(request.query);
    const usecase = app.container.resolve<ListSuggestedConnectionsUseCase>('usecase.user.listSuggested');
    const { suggestions } = await usecase.execute(query);
    return { suggestions };
  });

  app.post('/:userId/follow', async (request, reply) => {
    const params = FollowParamsSchema.parse(request.params);
    const body = FollowBodySchema.parse(request.body);
    const usecase = app.container.resolve<FollowUserUseCase>('usecase.user.follow');
    await usecase.execute({ followerId: body.followerId, followeeId: params.userId });
    reply.code(204).send();
  });

  app.delete('/:userId/follow', async (request, reply) => {
    const params = FollowParamsSchema.parse(request.params);
    const bodyResult = FollowBodySchema.safeParse(request.body ?? {});
    const queryFollower = FollowQuerySchema.parse(request.query ?? {}).followerId;
    const followerId = bodyResult.success ? bodyResult.data.followerId : queryFollower;
    if (!followerId) {
      throw new Error('followerId is required');
    }
    const usecase = app.container.resolve<UnfollowUserUseCase>('usecase.user.unfollow');
    await usecase.execute({ followerId, followeeId: params.userId });
    reply.code(204).send();
  });
}
