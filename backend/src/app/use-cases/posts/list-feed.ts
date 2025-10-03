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

    const interestSet = new Set((input.interests ?? []).map((interest) => interest.toLowerCase()));
    const scored = Array.from(merged.values()).map((post) => {
      const age = Math.max(1, Date.now() - post.createdAt.getTime());
      const recencyBoost = 1 / (age / (1000 * 60 * 60) + 1);

      const topic = post.toJSON().spiritualTopic ?? null;
      const tags = post.tags ?? [];
      let interestMatches = 0;

      if (topic && interestSet.has(String(topic).toLowerCase())) {
        interestMatches += 1.5;
      }

      tags.forEach((tag) => {
        if (typeof tag === 'string' && interestSet.has(tag.toLowerCase())) {
          interestMatches += 1;
        }
      });

      const engagement = (post.likesCount ?? 0) * 0.1 + (post.commentsCount ?? 0) * 0.2;
      const score = recencyBoost * 2 + interestMatches + engagement;

      return { post, score };
    });

    const orderedPosts = scored
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.post);

    return {
      posts: orderedPosts,
      recommendations: myRecommendations
    };
  }
}
