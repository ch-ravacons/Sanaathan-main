import type { PostRepository } from '../../../domain/posts/post.repository.js';
import { Post } from '../../../domain/posts/post.entity.js';

export interface ListUserPostsInput {
  userId: string;
  limit?: number;
}

export class ListUserPostsUseCase {
  constructor(private readonly posts: PostRepository) {}

  execute(input: ListUserPostsInput): Promise<Post[]> {
    return this.posts.listRecentByUser(input.userId, input.limit ?? 20);
  }
}
