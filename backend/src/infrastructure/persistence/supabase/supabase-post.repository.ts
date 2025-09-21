import { Post } from '../../../domain/posts/post.entity.js';
import type { CreatePostInput, PostRepository } from '../../../domain/posts/post.repository.js';
import type { AppConfig } from '../../../shared/config.js';
import { getSupabaseClient } from './supabase-client.js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  spiritual_topic: string | null;
  tags: string[] | null;
  moderation_status: 'approved' | 'pending' | 'flagged' | 'rejected';
  created_at: string;
  updated_at: string;
  likes_count?: number | null;
  comments_count?: number | null;
  shares_count?: number | null;
  users?: {
    id: string;
    email: string;
    full_name: string;
    spiritual_name?: string | null;
    spiritual_path?: string | null;
  } | null;
}

function mapRow(row: PostRow): Post {
  return new Post({
    id: row.id,
    userId: row.user_id,
    content: row.content,
    spiritualTopic: row.spiritual_topic,
    tags: row.tags ?? [],
    moderationStatus: row.moderation_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    likesCount: row.likes_count ?? undefined,
    commentsCount: row.comments_count ?? undefined,
    sharesCount: row.shares_count ?? undefined,
    author: row.users
      ? {
          id: row.users.id,
          email: row.users.email,
          fullName: row.users.full_name,
          spiritualName: row.users.spiritual_name ?? null,
          spiritualPath: row.users.spiritual_path ?? null
        }
      : undefined
  });
}

export class SupabasePostRepository implements PostRepository {
  private readonly client: SupabaseClient;

  constructor(private readonly config: AppConfig) {
    this.client = getSupabaseClient(config);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const { data, error } = await this.client
      .from('posts')
      .insert({
        id: input.id,
        user_id: input.userId,
        content: input.content,
        spiritual_topic: input.spiritualTopic ?? null,
        tags: input.tags ?? [],
        moderation_status: input.moderationStatus ?? 'pending'
      })
      .select(`*, users(id, email, full_name, spiritual_name, spiritual_path)`).single<PostRow>();

    if (error || !data) {
      throw new Error(`Failed to insert post: ${error?.message ?? 'unknown error'}`);
    }

    return mapRow(data);
  }

  async listRecentByUser(userId: string, limit: number): Promise<Post[]> {
    const { data, error } = await this.client
      .from('posts')
      .select(`*, users(id, email, full_name, spiritual_name, spiritual_path)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list user posts: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async listPublicFeed(limit: number): Promise<Post[]> {
    const { data, error } = await this.client
      .from('posts')
      .select(`*, users(id, email, full_name, spiritual_name, spiritual_path)`)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list feed posts: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }
}
