import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { ListSuggestedConnectionsUseCase } from '../../app/use-cases/users/list-suggested-connections.js';
import type { FollowUserUseCase } from '../../app/use-cases/users/follow-user.js';
import type { UnfollowUserUseCase } from '../../app/use-cases/users/unfollow-user.js';
import type { GenerateAvatarUploadUrlUseCase } from '../../app/use-cases/users/generate-avatar-upload-url.js';
import type { UpdateUserAvatarUseCase } from '../../app/use-cases/users/update-user-avatar.js';

const SuggestionQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional()
});

const FollowParamsSchema = z.object({ userId: z.string().uuid() });
const FollowBodySchema = z.object({ followerId: z.string().uuid() });
const FollowQuerySchema = z.object({ followerId: z.string().uuid().optional() });
const AvatarUploadSchema = z.object({ userId: z.string().uuid(), fileName: z.string().min(3) });
const UpdateAvatarSchema = z.object({ avatarUrl: z.string().url() });

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

  app.post('/avatar/upload-url', async (request) => {
    const payload = AvatarUploadSchema.parse(request.body);
    const usecase = app.container.resolve<GenerateAvatarUploadUrlUseCase>('usecase.user.avatarUploadUrl');
    return usecase.execute(payload);
  });

  app.patch('/:userId/avatar', async (request, reply) => {
    const params = FollowParamsSchema.parse(request.params);
    const payload = UpdateAvatarSchema.parse(request.body);
    const usecase = app.container.resolve<UpdateUserAvatarUseCase>('usecase.user.updateAvatar');
    await usecase.execute({ userId: params.userId, avatarUrl: payload.avatarUrl });
    reply.code(204).send();
  });
}
