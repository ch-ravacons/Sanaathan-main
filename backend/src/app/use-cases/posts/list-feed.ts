import type { PostRepository } from '../../../domain/posts/post.repository.js';
import type { AiOrchestrator } from '../../../domain/ai/orchestrator.js';
import type { RetrievalResult } from '../../../domain/ai/knowledge.entity.js';
import { Post } from '../../../domain/posts/post.entity.js';

export interface ListFeedInput {
  userId?: string;
  interests?: string[];
  limit?: number;
}

export interface PersonalizedFeed {
  posts: Post[];
  recommendations: RetrievalResult[];
}

export class ListFeedUseCase {
  constructor(private readonly posts: PostRepository, private readonly ai: AiOrchestrator) {}

  async execute(input: ListFeedInput): Promise<PersonalizedFeed> {
    const limit = input.limit ?? 20;
    const [publicPosts, myRecommendations, myPosts] = await Promise.all([
      this.posts.listPublicFeed(limit),
      this.ai.retrieve({
        query: 'latest community insights',
        userId: input.userId,
        interests: input.interests,
        topK: 5
      }),
      input.userId ? this.posts.listRecentByUser(input.userId, limit) : Promise.resolve([])
    ]);

    const merged = new Map<string, Post>();
    publicPosts.forEach((post) => merged.set(post.id, post));
    myPosts.forEach((post) => merged.set(post.id, post));

    const orderedPosts = Array.from(merged.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return {
      posts: orderedPosts,
      recommendations: myRecommendations
    };
  }
}
