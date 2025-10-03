import { z } from 'zod';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';
const SUPABASE_STORAGE_BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? null;

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const PostMediaSchema = z
  .object({
    id: z.string(),
    type: z.enum(['image', 'video']).optional().nullable(),
    media_type: z.enum(['image', 'video']).optional().nullable(),
    url: z.string().nullable().optional(),
    public_url: z.string().nullable().optional(),
    thumbnail_url: z.string().nullable().optional(),
    alt_text: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
    storage_bucket: z.string().nullable().optional()
  })
  .transform((value) => {
    const metadata = (value.metadata && typeof value.metadata === 'object' && !Array.isArray(value.metadata)
      ? (value.metadata as Record<string, unknown>)
      : {}) ?? {};
    const candidateUrl = [value.url, value.public_url, metadata.url as string | undefined].find(
      (candidate) => typeof candidate === 'string' && candidate.trim().length > 0
    );
    const path = (metadata.path as string | undefined) ?? (metadata.objectPath as string | undefined);
    const storageBucket = value.storage_bucket ?? (metadata.storageBucket as string | undefined) ?? null;

    let resolvedUrl: string | null = candidateUrl ? candidateUrl.trim() : null;

    if (resolvedUrl && !/^https?:\/\//i.test(resolvedUrl)) {
      if (SUPABASE_STORAGE_BASE && storageBucket && path) {
        resolvedUrl = `${SUPABASE_STORAGE_BASE}/storage/v1/object/public/${storageBucket}/${path}`;
      } else if (SUPABASE_STORAGE_BASE && storageBucket) {
        resolvedUrl = `${SUPABASE_STORAGE_BASE}/storage/v1/object/public/${storageBucket}/${resolvedUrl.replace(/^\//, '')}`;
      } else {
        resolvedUrl = null;
      }
    }

    return {
      id: value.id,
      type: (value.type ?? value.media_type ?? 'image') as 'image' | 'video',
      url: resolvedUrl,
      thumbnail_url: value.thumbnail_url ?? null,
      alt_text: value.alt_text ?? (metadata.originalName as string | undefined) ?? null,
      metadata,
      storage_bucket: storageBucket
    };
  });

const PostAuthorSchema = z
  .object({
    id: z.string(),
    email: z.string().email().optional(),
    full_name: z.string().nullable().optional(),
    spiritual_name: z.string().nullable().optional(),
    spiritual_path: z.string().nullable().optional(),
    interests: z.array(z.string()).optional()
  })
  .optional();

const PostSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    content: z.string(),
    spiritual_topic: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    moderation_status: z.enum(['approved', 'pending', 'flagged', 'rejected']).optional(),
    is_moderated: z.boolean().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    likes_count: z.number().int().optional(),
    comments_count: z.number().int().optional(),
    shares_count: z.number().int().optional(),
    media: z.array(PostMediaSchema).optional(),
    user: PostAuthorSchema,
    author: PostAuthorSchema
  })
  .transform((value) => ({
    ...value,
    tags: value.tags ?? [],
    likes_count: value.likes_count ?? 0,
    comments_count: value.comments_count ?? 0,
    shares_count: value.shares_count ?? 0,
    media: value.media ?? [],
    user: value.user ?? value.author
  }));

const PostResponseSchema = z.object({ post: PostSchema });
const FeedResponseSchema = z.object({
  posts: z.array(PostSchema),
  recommendations: z.array(z.unknown()).optional()
});

const SuggestedConnectionSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  spiritual_path: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  shared_interests: z.array(z.string()).optional(),
  mutual_followers: z.number().int().optional(),
  avatar_url: z.string().url().nullable().optional(),
  is_following: z.boolean().optional(),
  vedic_qualifications: z.array(z.string()).optional(),
  spiritual_qualifications: z.array(z.string()).optional(),
  years_of_experience: z.number().nullable().optional(),
  areas_of_guidance: z.array(z.string()).optional(),
  languages_spoken: z.array(z.string()).optional(),
  introduction: z.string().nullable().optional()
});
const SuggestedConnectionsResponseSchema = z.object({
  suggestions: z.array(SuggestedConnectionSchema)
});

const TrendingTopicSchema = z.object({
  topic: z.string(),
  post_count: z.number().int(),
  like_count: z.number().int().optional(),
  velocity_score: z.number().optional(),
  sentiment: z.string().optional()
});
const TrendingTopicsResponseSchema = z.object({
  topics: z.array(TrendingTopicSchema)
});

const DailyReadingSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  source_url: z.string().url().nullable().optional(),
  path: z.string(),
  difficulty: z.string().optional(),
  recommended_at: z.string().optional(),
  summary: z.string().optional(),
  media: z.array(PostMediaSchema).optional()
});
const DailyReadingResponseSchema = z.object({ reading: DailyReadingSchema });

const CommunityMemberSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  spiritual_path: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(),
  avatar_url: z.string().url().nullable().optional(),
  location: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  vedic_qualifications: z.array(z.string()).optional(),
  spiritual_qualifications: z.array(z.string()).optional(),
  years_of_experience: z.number().nullable().optional(),
  areas_of_guidance: z.array(z.string()).optional(),
  languages_spoken: z.array(z.string()).optional(),
  introduction: z.string().nullable().optional()
});
const CommunityResponseSchema = z.object({
  members: z.array(CommunityMemberSchema),
  nextCursor: z.string().nullable().optional()
});

const EventSchema = z.object({
  id: z.string(),
  creator_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  start_at: z.string(),
  end_at: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  capacity: z.number().int().nullable().optional(),
  attendees_count: z.number().int().optional(),
  is_attending: z.boolean().optional()
});
const EventListResponseSchema = z.object({ events: z.array(EventSchema) });
const EventDetailResponseSchema = z.object({ event: EventSchema });

const DevotionPracticeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
  base_points: z.number().int(),
  icon: z.string().nullable().optional()
});
const DevotionPracticesResponseSchema = z.object({ practices: z.array(DevotionPracticeSchema) });
const DevotionSummarySchema = z.object({
  total_points: z.number().int(),
  streak: z.number().int(),
  level: z.number().int(),
  meter: z.number().min(0).max(100).optional(),
  last_practiced_at: z.string().nullable().optional(),
  recent_logs: z
    .array(
      z.object({
        id: z.string(),
        practice_id: z.string(),
        performed_at: z.string(),
        points_awarded: z.number().int(),
        notes: z.string().nullable().optional()
      })
    )
    .optional()
});
const DevotionSummaryResponseSchema = z.object({ summary: DevotionSummarySchema });

const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string(),
  spiritual_name: z.string().nullable().optional(),
  spiritual_path: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(),
  path_practices: z.array(z.string()).optional(),
  location: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  vedic_qualifications: z.array(z.string()).optional(),
  spiritual_qualifications: z.array(z.string()).optional(),
  years_of_experience: z.number().nullable().optional(),
  areas_of_guidance: z.array(z.string()).optional(),
  languages_spoken: z.array(z.string()).optional(),
  availability: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  achievements: z.array(z.string()).optional(),
  offerings: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  introduction: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

const AgentSourceSchema = z.object({ title: z.string(), url: z.string().url(), snippet: z.string().optional() });
const AgentResponseSchema = z.object({
  message: z.string(),
  sources: z.array(AgentSourceSchema).optional(),
  metadata: z.record(z.unknown()).optional()
});

const UploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  assetId: z.string(),
  headers: z.record(z.string()).optional(),
  publicUrl: z.string().url().nullable().optional(),
  path: z.string().optional()
});

export type ApiPost = z.infer<typeof PostSchema>;
export type SuggestedConnection = z.infer<typeof SuggestedConnectionSchema>;
export type TrendingTopic = z.infer<typeof TrendingTopicSchema>;
export type DailyReading = z.infer<typeof DailyReadingSchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;
export type EventItem = z.infer<typeof EventSchema>;
export type DevotionPractice = z.infer<typeof DevotionPracticeSchema>;
export type DevotionSummary = z.infer<typeof DevotionSummarySchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

interface RequestOptions extends RequestInit {
  parseAsJson?: boolean;
}

type RequestSchema<T> = z.ZodType<T> | z.ZodEffects<z.ZodTypeAny, T>;

async function request<T>(path: string, schema?: RequestSchema<T>, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    let payload: unknown;
    try {
      const text = await response.text();
      payload = text ? JSON.parse(text) : undefined;
    } catch {
      payload = undefined;
    }
    throw new ApiError(`API request failed with status ${response.status}`, response.status, payload);
  }

  if (response.status === 204 || schema === undefined) {
    return undefined as T;
  }

  const data = await response.json();
  return schema.parse(data);
}

function buildQuery(params: Record<string, unknown | undefined>) {
  const urlSearchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => urlSearchParams.append(key, String(item)));
    } else {
      urlSearchParams.set(key, String(value));
    }
  });
  const queryString = urlSearchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const queryKeys = {
  posts: {
    feed: (params: { userId?: string; interests?: string[]; mine?: boolean }) => ['posts', 'feed', params]
  },
  suggestions: (userId?: string | null) => ['users', 'suggestions', userId ?? 'anonymous'],
  trending: (window: string) => ['posts', 'trending', window],
  dailyReading: (path: string | null) => ['readings', path ?? 'all'],
  community: (interest: string | null) => ['community', interest ?? 'all'],
  communityInfinite: (interest: string | null) => ['community', 'infinite', interest ?? 'all'],
  events: (filters: Record<string, unknown>) => ['events', filters],
  devotion: {
    practices: () => ['devotion', 'practices'],
    summary: (userId?: string | null) => ['devotion', 'summary', userId ?? 'anonymous']
  },
  agent: (topic: string) => ['agent', topic],
  users: {
    profile: (userId: string) => ['users', 'profile', userId]
  }
};

export const api = {
  async createPost(input: {
    userId: string;
    content: string;
    spiritualTopic?: string | null;
    tags?: string[];
    media?: Array<{ assetId: string; type: 'image' | 'video'; metadata?: Record<string, unknown> }>;
  }) {
    return request('/api/v1/posts', PostResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        content: input.content,
        spiritualTopic: input.spiritualTopic ?? null,
        tags: input.tags ?? [],
        media: input.media ?? []
      })
    });
  },

  async listPosts(params: { userId?: string; interests?: string[]; limit?: number; mine?: boolean }) {
    const query = buildQuery({
      userId: params.userId,
      limit: params.limit,
      interests: params.interests,
      mine: typeof params.mine === 'boolean' ? params.mine : undefined
    });
    return request(`/api/v1/posts${query}`, FeedResponseSchema);
  },

  async getSuggestedConnections(params: { userId?: string; limit?: number }) {
    const query = buildQuery({ userId: params.userId, limit: params.limit });
    return request(`/api/v1/users/suggestions${query}`, SuggestedConnectionsResponseSchema);
  },

  async followUser(params: { followerId: string; followeeId: string }) {
    return request(`/api/v1/users/${params.followeeId}/follow`, undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: params.followerId })
    });
  },

  async unfollowUser(params: { followerId: string; followeeId: string }) {
    const query = buildQuery({ followerId: params.followerId });
    const url = `/api/v1/users/${params.followeeId}/follow${query}`;
    return request(url, undefined, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: params.followerId })
    });
  },

  async getAvatarUploadUrl(params: { userId: string; fileName: string }) {
    return request('/api/v1/users/avatar/upload-url', UploadUrlResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  async updateUserAvatar(params: { userId: string; avatarUrl: string }) {
    return request(`/api/v1/users/${params.userId}/avatar`, undefined, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: params.avatarUrl })
    });
  },

  async getTrendingTopics(params: { window?: string; limit?: number }) {
    const query = buildQuery({ window: params.window, limit: params.limit });
    return request(`/api/v1/posts/trending${query}`, TrendingTopicsResponseSchema);
  },

  async getUploadUrl(params: { userId: string; mediaType: 'image' | 'video'; fileName: string }) {
    return request('/api/v1/posts/upload-url', UploadUrlResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  async getDailyReading(params: { path?: string | null }) {
    const query = buildQuery({ path: params.path });
    return request(`/api/v1/readings/today${query}`, DailyReadingResponseSchema);
  },

  async markReadingComplete(params: { readingId: string; userId: string }) {
    return request(`/api/v1/readings/${params.readingId}/complete`, undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: params.userId })
    });
  },

  async getCommunityMembers(params: { interest?: string; cursor?: string; limit?: number }) {
    const query = buildQuery({ interest: params.interest, cursor: params.cursor, limit: params.limit });
    return request(`/api/v1/community${query}`, CommunityResponseSchema);
  },

  async createEvent(input: {
    creatorId: string;
    title: string;
    description?: string;
    startAt: string;
    endAt?: string | null;
    location?: string;
    tags?: string[];
    capacity?: number | null;
    media?: Array<{ assetId: string; type: 'image' | 'video' }>;
  }) {
    return request('/api/v1/events', EventDetailResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  },

  async listEvents(params: { startAfter?: string; interest?: string; attending?: boolean; userId?: string }) {
    const query = buildQuery(params);
    return request(`/api/v1/events${query}`, EventListResponseSchema);
  },

  async rsvpEvent(params: { eventId: string; userId: string; status: 'going' | 'interested' | 'not_going' }) {
    return request(`/api/v1/events/${params.eventId}/rsvp`, EventDetailResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: params.userId, status: params.status })
    });
  },

  async downloadEventIcs(eventId: string) {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/ics`);
    if (!response.ok) {
      throw new ApiError(`Failed to generate calendar file`, response.status);
    }
    return response.text();
  },

  async getDevotionPractices() {
    return request('/api/v1/devotion/practices', DevotionPracticesResponseSchema);
  },

  async logDevotionPractice(input: { userId: string; practiceId: string; performedAt: string; intensity?: 'light' | 'medium' | 'intense'; notes?: string }) {
    return request('/api/v1/devotion/log', DevotionSummaryResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  },

  async getDevotionSummary(params: { userId: string }) {
    const query = buildQuery({ userId: params.userId });
    return request(`/api/v1/devotion/summary${query}`, DevotionSummaryResponseSchema);
  },

  async askAgent(input: { agent: 'rag' | 'kag' | 'guidance'; query: string; userId?: string; context?: Record<string, unknown> }) {
    return request('/api/v1/ai/ask', AgentResponseSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  },

  async getUserProfile(userId: string) {
    const result = await request(`/api/v1/users/${userId}`, z.object({ user: UserProfileSchema.nullable() }));
    return result.user;
  }
};

export type ApiClient = typeof api;
