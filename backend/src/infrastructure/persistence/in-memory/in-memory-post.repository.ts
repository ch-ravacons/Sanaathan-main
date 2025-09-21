import { Post } from '../../../domain/posts/post.entity.js';
import type { CreatePostInput, PostRepository } from '../../../domain/posts/post.repository.js';

export class InMemoryPostRepository implements PostRepository {
  private readonly items = new Map<string, Post>();

  async create(input: CreatePostInput): Promise<Post> {
    const now = new Date();
    const post = new Post({
      id: input.id,
      userId: input.userId,
      content: input.content,
      spiritualTopic: input.spiritualTopic ?? null,
      tags: input.tags ?? [],
      moderationStatus: input.moderationStatus ?? 'pending',
      createdAt: now,
      updatedAt: now
    });
    this.items.set(post.id, post);
    return post;
  }

  async listRecentByUser(userId: string, limit: number): Promise<Post[]> {
    return [...this.items.values()]
      .filter((post) => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async listPublicFeed(limit: number): Promise<Post[]> {
    return [...this.items.values()]
      .filter((post) => post.moderationStatus === 'approved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
