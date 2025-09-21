import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { CreatePostUseCase } from '../../app/use-cases/posts/create-post.js';
import type { ListUserPostsUseCase } from '../../app/use-cases/posts/list-user-posts.js';
import type { ListFeedUseCase } from '../../app/use-cases/posts/list-feed.js';
import type { ListTrendingTopicsUseCase } from '../../app/use-cases/posts/list-trending-topics.js';
import type { GenerateMediaUploadUrlUseCase } from '../../app/use-cases/posts/generate-media-upload-url.js';
import type { Post } from '../../domain/posts/post.entity.js';

const CreatePostSchema = z.object({
  userId: z.string().uuid(),
  content: z.string().min(10),
  spiritualTopic: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

const FeedQuerySchema = z
  .object({
    userId: z.string().uuid().optional(),
    interests: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          return value.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return undefined;
      }),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    mine: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return undefined;
      })
  })
  .transform((value) => value);

const TrendingQuerySchema = z.object({
  window: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(25).optional()
});

const UploadUrlSchema = z.object({
  userId: z.string().uuid(),
  mediaType: z.enum(['image', 'video']),
  fileName: z.string().min(3)
});

function adaptPost(post: Post) {
  const json = post.toJSON();
  return {
    id: json.id,
    user_id: json.userId,
    content: json.content,
    spiritual_topic: json.spiritualTopic ?? null,
    tags: json.tags,
    moderation_status: json.moderationStatus,
    is_moderated: json.moderationStatus === 'approved',
    created_at: json.createdAt.toISOString(),
    updated_at: json.updatedAt.toISOString(),
    likes_count: json.likesCount ?? 0,
    comments_count: json.commentsCount ?? 0,
    shares_count: json.sharesCount ?? 0,
    user: json.author
      ? {
          id: json.author.id,
          email: json.author.email,
          full_name: json.author.fullName,
          spiritual_name: json.author.spiritualName ?? null,
          spiritual_path: json.author.spiritualPath ?? null
        }
      : undefined
  };
}

export async function registerPostRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.post('/', async (request, reply) => {
    const payload = CreatePostSchema.parse(request.body);
    const createPost = app.container.resolve<CreatePostUseCase>('usecase.post.create');
    const post = await createPost.execute({
      userId: payload.userId,
      content: payload.content,
      spiritualTopic: payload.spiritualTopic ?? null,
      tags: payload.tags ?? []
    });

    reply.code(201).send({ post: adaptPost(post) });
  });

  app.get('/', async (request) => {
    const query = FeedQuerySchema.parse(request.query);

    if (query.mine && !query.userId) {
      throw new Error('userId is required when mine=true');
    }

    if (query.mine && query.userId) {
      const listUserPosts = app.container.resolve<ListUserPostsUseCase>('usecase.post.listUser');
      const posts = await listUserPosts.execute({ userId: query.userId, limit: query.limit });
      return { posts: posts.map(adaptPost) };
    }

    const listFeed = app.container.resolve<ListFeedUseCase>('usecase.post.listFeed');
    const feed = await listFeed.execute({
      userId: query.userId,
      interests: query.interests,
      limit: query.limit
    });

    return {
      posts: feed.posts.map(adaptPost),
      recommendations: feed.recommendations
    };
  });

  app.get('/trending', async (request) => {
    const query = TrendingQuerySchema.parse(request.query);
    const usecase = app.container.resolve<ListTrendingTopicsUseCase>('usecase.post.listTrending');
    const { topics } = await usecase.execute(query);
    return { topics };
  });

  app.post('/upload-url', async (request) => {
    const payload = UploadUrlSchema.parse(request.body);
    const usecase = app.container.resolve<GenerateMediaUploadUrlUseCase>('usecase.post.generateUploadUrl');
    const result = await usecase.execute(payload);
    return result;
  });
}
