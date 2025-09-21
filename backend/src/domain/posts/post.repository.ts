import { Post } from './post.entity.js';

export interface CreatePostInput {
  id: string;
  userId: string;
  content: string;
  spiritualTopic?: string | null;
  tags: string[];
  moderationStatus?: 'approved' | 'pending' | 'flagged' | 'rejected';
}

export interface PostRepository {
  listRecentByUser(userId: string, limit: number): Promise<Post[]>;
  listPublicFeed(limit: number): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
}
