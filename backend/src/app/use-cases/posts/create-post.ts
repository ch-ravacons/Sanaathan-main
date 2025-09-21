import { randomUUID } from 'node:crypto';

import type { PostRepository } from '../../../domain/posts/post.repository.js';
import type { AiOrchestrator } from '../../../domain/ai/orchestrator.js';
import { Post } from '../../../domain/posts/post.entity.js';

export interface CreatePostInput {
  userId: string;
  content: string;
  spiritualTopic?: string | null;
  tags?: string[];
  media?: Array<{ assetId: string; type: 'image' | 'video'; metadata?: Record<string, unknown> }>;
}

export class CreatePostUseCase {
  constructor(private readonly posts: PostRepository, private readonly ai: AiOrchestrator) {}

  async execute(input: CreatePostInput): Promise<Post> {
    const post = await this.posts.create({
      id: randomUUID(),
      userId: input.userId,
      content: input.content,
      spiritualTopic: input.spiritualTopic ?? null,
      tags: input.tags ?? [],
      moderationStatus: 'pending',
      media: input.media
    });

    // Kick off asynchronous ingestion for RAG/KAG pipelines
    await this.ai.ingest({
      node: {
        id: post.id,
        source: 'post',
        title: input.content.slice(0, 120),
        summary: input.content,
        embeddingId: undefined,
        metadata: {
          userId: input.userId,
          spiritualTopic: input.spiritualTopic,
          tags: input.tags ?? []
        },
        createdAt: new Date()
      }
    });

    return post;
  }
}
