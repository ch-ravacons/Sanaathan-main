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
  post_media?: Array<{
    id: string;
    media_type: string | null;
    metadata: Record<string, unknown> | null;
    media_uploads?: {
      id?: string;
      url: string | null;
      storage_bucket: string | null;
      metadata: Record<string, unknown> | null;
    } | null;
  }> | null;
}

function mapRow(row: PostRow): Post {
  const media = (row.post_media ?? []).map((item) => ({
    id: item.id,
    url: item.media_uploads?.url ?? '',
    mediaType: (item.media_type ?? 'image') as 'image' | 'video',
    metadata: item.metadata ?? item.media_uploads?.metadata ?? null,
    storageBucket: item.media_uploads?.storage_bucket ?? null
  }));

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
      : undefined,
    media
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
      .select(`*, users(id, email, full_name, spiritual_name, spiritual_path), post_media(id, media_type, metadata, media_uploads(url, storage_bucket, metadata))`)
      .single<PostRow>();

    if (error || !data) {
      throw new Error(`Failed to insert post: ${error?.message ?? 'unknown error'}`);
    }

    if (input.media?.length) {
      const rows = input.media.map((item) => ({
        post_id: input.id,
        media_id: item.assetId,
        media_type: item.type,
        metadata: item.metadata ?? {}
      }));

      const { error: mediaError } = await this.client.from('post_media').upsert(rows);
      if (mediaError) {
        throw new Error(`Failed to attach media to post: ${mediaError.message}`);
      }

      const { data: refreshed, error: refreshError } = await this.client
        .from('posts')
        .select(`*, users(id, email, full_name, spiritual_name, spiritual_path), post_media(id, media_type, metadata, media_uploads(url, storage_bucket, metadata))`)
        .eq('id', input.id)
        .single<PostRow>();

      if (!refreshError && refreshed) {
        return mapRow(refreshed);
      }
    }

    return mapRow(data);
  }

  async listRecentByUser(userId: string, limit: number): Promise<Post[]> {
    const { data, error } = await this.client
      .from('posts')
      .select(`*, users(id, email, full_name, spiritual_name, spiritual_path), post_media(id, media_type, metadata, media_uploads(url, storage_bucket, metadata))`)
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
      .select(`*, users(id, email, full_name, spiritual_name, spiritual_path), post_media(id, media_type, metadata, media_uploads(url, storage_bucket, metadata))`)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list feed posts: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }
}
