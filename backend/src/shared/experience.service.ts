import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SuggestedConnectionDto {
  id: string;
  full_name: string;
  spiritual_path: string | null;
  location?: string | null;
  shared_interests: string[];
  mutual_followers: number;
  avatar_url?: string | null;
  is_following: boolean;
  vedic_qualifications?: string[];
  spiritual_qualifications?: string[];
  years_of_experience?: number | null;
  areas_of_guidance?: string[];
  languages_spoken?: string[];
  introduction?: string | null;
}

export interface TrendingTopicDto {
  topic: string;
  post_count: number;
  like_count: number;
  velocity_score: number;
  sentiment?: string;
}

export interface DailyReadingDto {
  id: string;
  title: string;
  body: string;
  source_url?: string | null;
  path: string;
  difficulty?: string;
  recommended_at: string;
  summary?: string;
}

export interface CommunityMemberDto {
  id: string;
  full_name: string;
  spiritual_path: string | null;
  interests: string[];
  avatar_url?: string | null;
  location?: string | null;
  bio?: string | null;
  vedic_qualifications?: string[];
  spiritual_qualifications?: string[];
  years_of_experience?: number | null;
  areas_of_guidance?: string[];
  languages_spoken?: string[];
  introduction?: string | null;
}

export interface EventDto {
  id: string;
  creator_id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location?: string | null;
  tags: string[];
  capacity?: number | null;
  attendees_count: number;
  is_attending: boolean;
}

export interface DevotionPracticeDto {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  base_points: number;
  icon?: string | null;
}

export interface DevotionLogDto {
  id: string;
  practice_id: string;
  performed_at: string;
  points_awarded: number;
  notes?: string | null;
}

export interface DevotionSummaryDto {
  total_points: number;
  streak: number;
  level: number;
  meter: number;
  last_practiced_at: string | null;
  recent_logs: DevotionLogDto[];
}

interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

interface RSVPEntry {
  status: 'going' | 'interested' | 'not_going';
  updatedAt: string;
}

function decodeCursor(cursor?: string | null): number {
  if (!cursor) return 0;
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw) as { offset?: number };
    return Number.isFinite(parsed.offset) ? parsed.offset! : 0;
  } catch {
    return 0;
  }
}

function encodeCursor(offset: number): string | null {
  if (offset <= 0) return null;
  return Buffer.from(JSON.stringify({ offset })).toString('base64');
}

export class ExperienceService {
  constructor(private readonly client?: SupabaseClient) {}

  private readonly fallbackSuggestedConnections: SuggestedConnectionDto[] = [
    {
      id: 'b0cd98df-4e17-4a89-9cd2-5681a4c6e001',
      full_name: 'Swami Aniruddha',
      spiritual_path: 'Vaishnava',
      shared_interests: ['Bhagavad Gita', 'Kirtan'],
      mutual_followers: 3,
      avatar_url: null,
      is_following: false,
      location: 'Vrindavan, India',
      vedic_qualifications: ['Bhakti Shastri', 'Sanskrit Scholar'],
      spiritual_qualifications: ['Initiated Guru'],
      years_of_experience: 18,
      areas_of_guidance: ['Devotional Practices', 'Scripture Study'],
      languages_spoken: ['Hindi', 'English'],
      introduction: 'Guiding seekers on the path of Bhakti for nearly two decades.'
    },
    {
      id: '61f26f41-45e9-4541-9358-7d6e8fec8591',
      full_name: 'Meenakshi Devi',
      spiritual_path: 'Shakta',
      shared_interests: ['Devi Mahatmyam', 'Navaratri'],
      mutual_followers: 5,
      avatar_url: null,
      is_following: false,
      location: 'Chennai, India',
      vedic_qualifications: ['Shakta Tantra Acharya'],
      spiritual_qualifications: ['Navaratri Ritualist'],
      years_of_experience: 12,
      areas_of_guidance: ['Devi Worship', 'Ritual Arts'],
      languages_spoken: ['Tamil', 'English'],
      introduction: 'Priestess and scholar focusing on Devi traditions.'
    },
    {
      id: '97a54f0b-aa08-4f5f-b6e7-5444f8a6adcd',
      full_name: 'Guru Prakash',
      spiritual_path: 'Advaita',
      shared_interests: ['Upanishads', 'Meditation'],
      mutual_followers: 2,
      avatar_url: null,
      is_following: false,
      location: 'Rishikesh, India',
      vedic_qualifications: ['Advaita Vedanta Vidwan'],
      spiritual_qualifications: ['Sanyasa Diksha'],
      years_of_experience: 22,
      areas_of_guidance: ['Jnana Yoga', 'Meditation'],
      languages_spoken: ['Hindi', 'English', 'Sanskrit'],
      introduction: 'Advaita teacher hosting retreats across the Himalayas.'
    },
    {
      id: '8f3f35af-b5bf-46ee-9ee6-8c3b4d138a88',
      full_name: 'Priya Sharma',
      spiritual_path: 'Shaiva',
      shared_interests: ['Mahashivratri', 'Rudram'],
      mutual_followers: 4,
      avatar_url: null,
      is_following: false,
      location: 'Kathmandu, Nepal',
      vedic_qualifications: ['Agama Shastra Pandit'],
      spiritual_qualifications: ['Shaiva Guru'],
      years_of_experience: 15,
      areas_of_guidance: ['Shaiva Tantra', 'Sound Healing'],
      languages_spoken: ['Nepali', 'English'],
      introduction: 'Shaiva mentor blending mantra therapy with daily sadhana guidance.'
    }
  ];

  private readonly fallbackTrendingTopics: TrendingTopicDto[] = [
    { topic: 'Bhagavad Gita', post_count: 128, like_count: 482, velocity_score: 0.92, sentiment: 'positive' },
    { topic: 'Navaratri', post_count: 86, like_count: 365, velocity_score: 0.88, sentiment: 'joyful' },
    { topic: 'Meditation Retreats', post_count: 54, like_count: 212, velocity_score: 0.74 },
    { topic: 'Devi Mahatmyam', post_count: 43, like_count: 190, velocity_score: 0.7, sentiment: 'devotional' },
    { topic: 'Kirtan', post_count: 67, like_count: 240, velocity_score: 0.69, sentiment: 'uplifting' }
  ];

  private readonly fallbackDailyReadingsByPath = new Map<string, DailyReadingDto[]>([
    [
      'vaishnava',
      [
        {
          id: 'reading-vaishnava-1',
          title: 'Bhagavad Gita – Chapter 12',
          body:
            'Lord Krishna describes the qualities of a true devotee who is very dear to Him. Reflect on verses 13-20 and contemplate how compassion, equanimity, and devotion manifest in your daily life.',
          source_url: 'https://vedabase.io/en/library/bg/12/13-20/',
          path: 'vaishnava',
          difficulty: 'intermediate',
          recommended_at: new Date().toISOString(),
          summary:
            'Devotion expressed through humility, compassion, and unwavering faith forms the heart of Bhakti as shared by Lord Krishna.'
        }
      ]
    ],
    [
      'shakta',
      [
        {
          id: 'reading-shakta-1',
          title: 'Devi Mahatmyam – Chapter 5',
          body:
            'Goddess Durga engages in a fierce battle with the asura Dhumralochana. Meditate on the symbolism of the divine feminine conquering arrogance and ego.',
          source_url: 'https://www.sacred-texts.com/hin/dg/dg11.htm',
          path: 'shakta',
          difficulty: 'intermediate',
          recommended_at: new Date().toISOString(),
          summary:
            'The Devi’s victory reminds us to invoke inner strength and clarity when facing the forces clouding our discernment.'
        }
      ]
    ]
  ]);

  private readonly fallbackReadings: DailyReadingDto[] = [
    {
      id: 'reading-general-1',
      title: 'Yoga Sutra 1.2',
      body:
        'Yogas chitta vritti nirodhah – Yoga is the stilling of the fluctuations of the mind. Take five minutes to breathe and observe your thoughts gently settle.',
      source_url: 'https://www.sacred-texts.com/hin/yogasutra/index.htm',
      path: 'general',
      difficulty: 'beginner',
      recommended_at: new Date().toISOString(),
      summary: 'Mindfulness arises when we lovingly observe the mind and rest in the Self beyond its waves.'
    }
  ];

  private readonly fallbackCommunityMembers: CommunityMemberDto[] = [
    {
      id: 'community-1',
      full_name: 'Ananya Iyer',
      spiritual_path: 'Vaishnava',
      interests: ['Bhagavad Gita', 'Bhakti Yoga'],
      location: 'Bengaluru, India',
      avatar_url: null,
      bio: 'Kirtan facilitator and Gita study circle host.',
      vedic_qualifications: ['Bhakti Shastri'],
      spiritual_qualifications: ['Certified Kirtan Leader'],
      years_of_experience: 9,
      areas_of_guidance: ['Kirtan', 'Bhakti Study'],
      languages_spoken: ['Kannada', 'English'],
      introduction: 'Leads weekly satsangs for urban professionals.'
    },
    {
      id: 'community-2',
      full_name: 'Ravi Narayanan',
      spiritual_path: 'Shaiva',
      interests: ['Mahashivratri', 'Rudram'],
      location: 'Coimbatore, India',
      avatar_url: null,
      bio: 'Volunteer at Isha Foundation, passionate about Nada Yoga.',
      vedic_qualifications: ['Veda Pathashala Graduate'],
      spiritual_qualifications: ['Isha Hatha Yoga Teacher'],
      years_of_experience: 7,
      areas_of_guidance: ['Hatha Yoga', 'Nada Yoga'],
      languages_spoken: ['Tamil', 'English']
    },
    {
      id: 'community-3',
      full_name: 'Saraswati Das',
      spiritual_path: 'Shakta',
      interests: ['Sri Vidya', 'Devi Mahatmyam'],
      location: 'Kolkatta, India',
      avatar_url: null,
      bio: 'Leads weekly lalita sahasranama chanting circles.',
      vedic_qualifications: ['Sri Vidya Upasaka'],
      spiritual_qualifications: ['Devi Sadhana Guide'],
      years_of_experience: 11,
      areas_of_guidance: ['Chanting', 'Ritual Arts'],
      languages_spoken: ['Bengali', 'Hindi', 'English']
    },
    {
      id: 'community-4',
      full_name: 'Rajesh Patel',
      spiritual_path: 'Smartism',
      interests: ['Upanishads', 'Jnana Yoga'],
      location: 'Ahmedabad, India',
      avatar_url: null,
      bio: 'Hosts Vedanta discussion groups for young seekers.',
      vedic_qualifications: ['Vedanta Acharya'],
      spiritual_qualifications: ['Jnana Yoga Coach'],
      years_of_experience: 10,
      areas_of_guidance: ['Vedanta', 'Mindfulness'],
      languages_spoken: ['Gujarati', 'Hindi', 'English']
    },
    {
      id: 'community-5',
      full_name: 'Lakshmi Prasad',
      spiritual_path: 'Vaishnava',
      interests: ['Kirtan', 'Seva'],
      location: 'Hyderabad, India',
      avatar_url: null,
      bio: 'Co-creates community seva opportunities with temple trusts.',
      vedic_qualifications: ['Bhakti Vaibhava'],
      spiritual_qualifications: ['Community Organizer'],
      years_of_experience: 8,
      areas_of_guidance: ['Seva Planning', 'Devotional Music'],
      languages_spoken: ['Telugu', 'English']
    }
  ];

  private events: EventDto[] = [
    {
      id: 'event-1',
      creator_id: 'b0cd98df-4e17-4a89-9cd2-5681a4c6e001',
      title: 'Full Moon Kirtan Gathering',
      description: 'An evening of ecstatic chanting under the full moon followed by satsang.',
      start_at: new Date(Date.now() + 86400000).toISOString(),
      end_at: new Date(Date.now() + 9000000).toISOString(),
      location: 'Community Yoga Hall, Bengaluru',
      tags: ['kirtan', 'bhakti'],
      capacity: 120,
      attendees_count: 48,
      is_attending: false
    }
  ];

  private readonly devotionPractices: DevotionPracticeDto[] = [
    { id: 'practice-1', name: 'Japa Meditation', description: '108 mantra repetitions', base_points: 20, category: 'meditation' },
    { id: 'practice-2', name: 'Scripture Reading', description: 'Read for at least 15 minutes', base_points: 15, category: 'study' },
    { id: 'practice-3', name: 'Seva', description: 'Offer service to temple/community', base_points: 25, category: 'service' },
    { id: 'practice-4', name: 'Kirtan', description: 'Lead or participate in kirtan session', base_points: 30, category: 'devotion' }
  ];

  private readonly readingCompletions = new Map<string, Set<string>>();
  private readonly devotionLogs = new Map<string, DevotionLogDto[]>();
  private readonly eventRsvps = new Map<string, Map<string, RSVPEntry>>();
  private readonly fallbackFollows = new Map<string, Set<string>>();

  async followUser(followerId: string, followeeId: string): Promise<void> {
    if (this.client) {
      await this.client.from('follows').upsert({ follower_id: followerId, followee_id: followeeId });
      return;
    }

    const set = this.fallbackFollows.get(followerId) ?? new Set<string>();
    set.add(followeeId);
    this.fallbackFollows.set(followerId, set);
  }

  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    if (this.client) {
      await this.client.from('follows').delete().eq('follower_id', followerId).eq('followee_id', followeeId);
      return;
    }

    const set = this.fallbackFollows.get(followerId);
    set?.delete(followeeId);
  }

  async listSuggestedConnections(limit = 5, userId?: string): Promise<SuggestedConnectionDto[]> {
    if (this.client) {
      try {
        const interestSet = new Set<string>();
        if (userId) {
          const { data: currentUser } = await this.client
            .from('users')
            .select('interests')
            .eq('id', userId)
            .maybeSingle();
          if (Array.isArray(currentUser?.interests)) {
            currentUser.interests.forEach((interest: string) => interestSet.add(interest));
          }
        }

        let query = this.client
          .from('users')
          .select(
            'id, full_name, spiritual_path, location, interests, avatar_url, vedic_qualifications, spiritual_qualifications, years_of_experience, areas_of_guidance, languages_spoken, introduction'
          )
          .order('updated_at', { ascending: false })
          .limit(Math.max(limit * 3, limit));

        if (userId) {
          query = query.neq('id', userId);
        }

        const { data, error } = await query;
        if (!error && data) {
          let followingIds: string[] = [];
          const mutualCounts = new Map<string, number>();
          if (userId) {
            const { data: following } = await this.client
              .from('follows')
              .select('followee_id')
              .eq('follower_id', userId);
            followingIds = following?.map((row: any) => row.followee_id) ?? [];

            const candidateIds = data.map((candidate: any) => candidate.id);
            if (candidateIds.length) {
              const { data: followerRows } = await this.client
                .from('follows')
                .select('follower_id, followee_id')
                .in('followee_id', candidateIds);

              followerRows?.forEach((row: any) => {
                if (followingIds.includes(row.follower_id)) {
                  const current = mutualCounts.get(row.followee_id) ?? 0;
                  mutualCounts.set(row.followee_id, current + 1);
                }
              });
            }
          }

          const suggestions = data
            .map((candidate: any) => {
              const candidateInterests = Array.isArray(candidate.interests) ? candidate.interests : [];
              const shared = candidateInterests.filter((interest: string) => interestSet.has(interest));
              return {
                id: candidate.id,
                full_name: candidate.full_name,
                spiritual_path: candidate.spiritual_path ?? null,
                location: candidate.location ?? null,
                shared_interests: shared,
                mutual_followers: mutualCounts.get(candidate.id) ?? 0,
                avatar_url: candidate.avatar_url ?? null,
                is_following: followingIds.includes(candidate.id),
                vedic_qualifications: Array.isArray(candidate.vedic_qualifications)
                  ? candidate.vedic_qualifications
                  : [],
                spiritual_qualifications: Array.isArray(candidate.spiritual_qualifications)
                  ? candidate.spiritual_qualifications
                  : [],
                years_of_experience: candidate.years_of_experience ?? null,
                areas_of_guidance: Array.isArray(candidate.areas_of_guidance)
                  ? candidate.areas_of_guidance
                  : [],
                languages_spoken: Array.isArray(candidate.languages_spoken)
                  ? candidate.languages_spoken
                  : [],
                introduction: candidate.introduction ?? null
              } satisfies SuggestedConnectionDto;
            })
            .sort((a, b) => {
              if (b.shared_interests.length !== a.shared_interests.length) {
                return b.shared_interests.length - a.shared_interests.length;
              }
              return (b.mutual_followers ?? 0) - (a.mutual_followers ?? 0);
            })
            .slice(0, limit);

          if (suggestions.length) {
            return suggestions;
          }
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to load suggested connections from Supabase:', error);
      }
    }
    const fallback = this.fallbackSuggestedConnections.slice(0, limit).map((suggestion) => ({
      ...suggestion,
      is_following: userId ? this.fallbackFollows.get(userId)?.has(suggestion.id) ?? false : false
    }));
    return fallback;
  }

  async listTrendingTopics(limit = 10, window?: string): Promise<TrendingTopicDto[]> {
    if (this.client) {
      try {
        const hours = this.resolveWindowToHours(window);
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        const { data, error } = await this.client
          .from('posts')
          .select('spiritual_topic, tags, likes_count, created_at')
          .gte('created_at', since)
          .limit(1000);

        if (!error && data) {
          const metrics = new Map<string, { postCount: number; likeCount: number; velocityScore: number }>();

          data.forEach((row: any) => {
            const tags = Array.isArray(row.tags) ? row.tags.filter(Boolean) : [];
            const topics = [row.spiritual_topic, ...tags].filter((value: string | null | undefined) => Boolean(value)) as string[];
            if (!topics.length) {
              return;
            }

            const createdAt = row.created_at ? new Date(row.created_at) : new Date();
            const ageHours = Math.max(1, (Date.now() - createdAt.getTime()) / (60 * 60 * 1000));

            topics.forEach((topic) => {
              const key = topic.toLowerCase();
              const current = metrics.get(key) ?? { postCount: 0, likeCount: 0, velocityScore: 0 };
              current.postCount += 1;
              current.likeCount += row.likes_count ?? 0;
              current.velocityScore += 1 / ageHours;
              metrics.set(key, current);
            });
          });

          const topics = Array.from(metrics.entries())
            .map(([topic, value]) => ({
              topic,
              post_count: value.postCount,
              like_count: value.likeCount,
              velocity_score: Number((value.velocityScore + value.postCount * 0.5 + value.likeCount * 0.1).toFixed(2))
            }))
            .sort((a, b) => b.velocity_score - a.velocity_score)
            .slice(0, limit);

          if (topics.length) {
            return topics;
          }
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to load trending topics from Supabase:', error);
      }
    }
    return this.fallbackTrendingTopics
      .map((topic) => ({
        ...topic,
        velocity_score: Number((topic.velocity_score * this.applyWindowWeight(window)).toFixed(2))
      }))
      .slice(0, limit);
  }

  private resolveWindowToHours(window?: string): number {
    if (!window) return 24;
    const normalized = window.trim().toLowerCase();
    if (normalized.endsWith('h')) {
      const hours = Number(normalized.slice(0, -1));
      return Number.isFinite(hours) && hours > 0 ? hours : 24;
    }
    if (normalized.endsWith('d')) {
      const days = Number(normalized.slice(0, -1));
      return Number.isFinite(days) && days > 0 ? days * 24 : 24;
    }
    const asNumber = Number(normalized);
    return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : 24;
  }

  private applyWindowWeight(window?: string) {
    const hours = this.resolveWindowToHours(window);
    if (hours <= 6) return 1.2;
    if (hours <= 24) return 1;
    if (hours <= 72) return 0.85;
    return 0.7;
  }

  async getDailyReading(path: string | null | undefined): Promise<DailyReadingDto> {
    if (this.client) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        let query = this.client
          .from('daily_readings')
          .select('id, title, reference, content, reading_date, path, summary')
          .lte('reading_date', today)
          .order('reading_date', { ascending: false })
          .limit(1);

        if (path) {
          query = query.eq('path', path.toLowerCase());
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          const description = typeof data.content === 'string' ? data.content : '';
          return {
            id: data.id,
            title: data.reference ? `${data.title} ${data.reference}` : data.title,
            body: description,
            source_url: null,
            path: data.path ?? path ?? 'general',
            recommended_at: new Date().toISOString(),
            summary: data.summary ?? (description ? `${description.slice(0, 160)}${description.length > 160 ? '…' : ''}` : undefined)
          } satisfies DailyReadingDto;
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to load daily reading from Supabase:', error);
      }
    }

    const bucket = path ? this.fallbackDailyReadingsByPath.get(path.toLowerCase()) : null;
    const reading = bucket?.[0] ?? this.fallbackReadings[0];
    return { ...reading, recommended_at: new Date().toISOString() };
  }

  async markReadingComplete(readingId: string, userId: string): Promise<void> {
    if (this.client) {
      try {
        await this.client
          .from('user_reading_history')
          .upsert({ user_id: userId, reading_id: readingId, source: 'daily_reading' });
        return;
      } catch (error) {
        console.warn('[ExperienceService] Failed to persist reading completion:', error);
      }
    }

    if (!this.readingCompletions.has(userId)) {
      this.readingCompletions.set(userId, new Set());
    }
    this.readingCompletions.get(userId)!.add(readingId);
  }

  async listCommunityMembers(
    interest: string | undefined,
    limit = 10,
    cursor?: string | null
  ): Promise<PaginatedResult<CommunityMemberDto>> {
    if (this.client) {
      try {
        const offset = decodeCursor(cursor);
        const pageSize = Math.max(1, Math.min(limit, 50));

        let query = this.client
          .from('users')
          .select(
            'id, full_name, spiritual_path, interests, location, bio, avatar_url, vedic_qualifications, spiritual_qualifications, years_of_experience, areas_of_guidance, languages_spoken, introduction'
          )
          .range(offset, offset + pageSize - 1)
          .order('created_at', { ascending: false });

        if (interest) {
          query = query.contains('interests', [interest]);
        }

        const { data, error } = await query;
        if (!error && data) {
          const items = data.map((row: any) => ({
            id: row.id,
            full_name: row.full_name,
            spiritual_path: row.spiritual_path ?? null,
            interests: Array.isArray(row.interests) ? row.interests : [],
            avatar_url: row.avatar_url ?? null,
            location: row.location ?? null,
            bio: row.bio ?? null,
            vedic_qualifications: Array.isArray(row.vedic_qualifications) ? row.vedic_qualifications : [],
            spiritual_qualifications: Array.isArray(row.spiritual_qualifications)
              ? row.spiritual_qualifications
              : [],
            years_of_experience: row.years_of_experience ?? null,
            areas_of_guidance: Array.isArray(row.areas_of_guidance) ? row.areas_of_guidance : [],
            languages_spoken: Array.isArray(row.languages_spoken) ? row.languages_spoken : [],
            introduction: row.introduction ?? null
          } satisfies CommunityMemberDto));

          const nextOffset = offset + items.length;
          const nextCursor = items.length === pageSize ? encodeCursor(nextOffset) : null;
          return { items, nextCursor };
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to load community members from Supabase:', error);
      }
    }

    let offset = decodeCursor(cursor);
    let filtered = this.fallbackCommunityMembers;
    if (interest) {
      const needle = interest.toLowerCase();
      filtered = filtered.filter((member) =>
        member.interests.some((item) => item.toLowerCase().includes(needle))
      );
    }

    const items = filtered.slice(offset, offset + limit);
    offset += items.length;
    const nextCursor = offset < filtered.length ? encodeCursor(offset) : null;

    return { items, nextCursor };
  }

  async createEvent(
    input: Omit<EventDto, 'id' | 'attendees_count' | 'is_attending'> & { is_attending?: boolean }
  ): Promise<EventDto> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('events')
          .insert({
            organizer_id: input.creator_id,
            title: input.title,
            description: input.description,
            start_time: input.start_at,
            end_time: input.end_at,
            location: input.location,
            tags: input.tags ?? [],
            capacity: input.capacity
          })
          .select('id, organizer_id, title, description, start_time, end_time, location, tags, capacity')
          .single();

        if (!error && data) {
          return {
            id: data.id,
            creator_id: data.organizer_id,
            title: data.title,
            description: data.description ?? null,
            start_at: data.start_time,
            end_at: data.end_time ?? null,
            location: data.location ?? null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            capacity: data.capacity ?? null,
            attendees_count: 0,
            is_attending: Boolean(input.is_attending)
          } satisfies EventDto;
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to create event in Supabase:', error);
      }
    }

    const event: EventDto = {
      ...input,
      id: randomUUID(),
      tags: input.tags ?? [],
      capacity: input.capacity ?? null,
      attendees_count: input.capacity ? Math.min(5, input.capacity) : 5,
      is_attending: Boolean(input.is_attending)
    };
    this.events = [event, ...this.events];
    return event;
  }

  async listEvents(options: { interest?: string; startAfter?: string; attending?: boolean; userId?: string | null } = {}): Promise<EventDto[]> {
    if (this.client) {
      try {
        const nowIso = options.startAfter ?? new Date().toISOString();
        let query = this.client
          .from('events')
          .select('id, organizer_id, title, description, start_time, end_time, location, tags, capacity')
          .gte('start_time', nowIso)
          .order('start_time', { ascending: true })
          .limit(50);

        if (options.interest) {
          query = query.contains('tags', [options.interest]);
        }

        const { data, error } = await query;
        if (!error && data) {
          const eventIds = data.map((row: any) => row.id);
          let attendeeRows: any[] = [];
          if (eventIds.length) {
            const { data: attendees } = await this.client
              .from('event_attendees')
              .select('event_id, user_id, status')
              .in('event_id', eventIds);
            attendeeRows = attendees ?? [];
          }

          let events = data.map((row: any) => {
            const attendeesForEvent = attendeeRows.filter((attendee) => attendee.event_id === row.id);
            return this.buildEventDto(row, attendeesForEvent, options.userId);
          });

          if (options.attending && options.userId) {
            events = events.filter((event) => event.is_attending);
          }

          return events;
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to list events from Supabase:', error);
      }
    }

    let events = this.events;
    if (options.interest) {
      const interestLower = options.interest.toLowerCase();
      events = events.filter((event) => event.tags.some((tag) => tag.toLowerCase() === interestLower));
    }
    if (options.attending && options.userId) {
      events = events.filter((event) => this.eventRsvps.get(event.id)?.get(options.userId!)?.status === 'going');
    }
    return events;
  }

  async rsvpEvent(eventId: string, userId: string, status: RSVPEntry['status']): Promise<EventDto | null> {
    if (this.client) {
      try {
        await this.client
          .from('event_attendees')
          .upsert({ event_id: eventId, user_id: userId, status });

        return await this.loadEventById(eventId, userId);
      } catch (error) {
        console.warn('[ExperienceService] Failed to RSVP for event:', error);
      }
    }

    const event = this.events.find((evt) => evt.id === eventId);
    if (!event) return null;

    if (!this.eventRsvps.has(eventId)) {
      this.eventRsvps.set(eventId, new Map());
    }
    this.eventRsvps.get(eventId)!.set(userId, { status, updatedAt: new Date().toISOString() });

    if (status === 'going') {
      event.attendees_count = Math.min(event.attendees_count + 1, event.capacity ?? event.attendees_count + 1);
      event.is_attending = true;
    } else if (status === 'not_going') {
      event.is_attending = false;
    }

    return event;
  }

  async generateEventIcs(eventId: string): Promise<string | null> {
    let event = this.events.find((evt) => evt.id === eventId);

    if (!event && this.client) {
      try {
        const { data } = await this.client
          .from('events')
          .select('id, organizer_id, title, description, start_time, end_time, location')
          .eq('id', eventId)
          .maybeSingle();

        if (data) {
          event = {
            id: data.id,
            creator_id: data.organizer_id,
            title: data.title,
            description: data.description ?? null,
            start_at: data.start_time,
            end_at: data.end_time ?? null,
            location: data.location ?? null,
            tags: [],
            capacity: null,
            attendees_count: 0,
            is_attending: false
          };
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to fetch event for ICS generation:', error);
      }
    }

    if (!event) return null;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sanaathan//Community Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@sanaathan.community`,
      `DTSTAMP:${this.formatDate(new Date())}`,
      `DTSTART:${this.formatDate(new Date(event.start_at))}`,
      event.end_at ? `DTEND:${this.formatDate(new Date(event.end_at))}` : undefined,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : undefined,
      event.location ? `LOCATION:${event.location}` : undefined,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean) as string[];
    return lines.join('\r\n');
  }

  listDevotionPractices(): DevotionPracticeDto[] {
    return this.devotionPractices;
  }

  async logDevotionPractice(
    userId: string,
    practiceId: string,
    points: number,
    intensity?: 'light' | 'medium' | 'intense',
    notes?: string | null
  ): Promise<DevotionSummaryDto> {
    if (this.client) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        await this.client
          .from('practice_logs')
          .upsert({
            user_id: userId,
            practice: practiceId,
            practice_id: practiceId,
            practiced_on: today,
            intensity,
            notes: notes ?? null,
            points_awarded: points
          });
        return this.getDevotionSummary(userId);
      } catch (error) {
        console.warn('[ExperienceService] Failed to log devotion practice in Supabase:', error);
      }
    }

    const now = new Date().toISOString();
    const log: DevotionLogDto = {
      id: randomUUID(),
      practice_id: practiceId,
      performed_at: now,
      points_awarded: points,
      notes: notes ?? null
    };

    const logs = this.devotionLogs.get(userId) ?? [];
    logs.unshift(log);
    this.devotionLogs.set(userId, logs.slice(0, 10));

    return this.getDevotionSummary(userId);
  }

  async getDevotionSummary(userId: string): Promise<DevotionSummaryDto> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('practice_logs')
          .select('id, practice, practiced_on')
          .eq('user_id', userId)
          .order('practiced_on', { ascending: false })
          .limit(60);

        if (!error && data) {
          const practiceMap = new Map(this.devotionPractices.map((practice) => [practice.id, practice]));
          const logs = data.map((row: any) => {
            const practice = practiceMap.get(row.practice) ?? this.devotionPractices[0];
            return {
              id: row.id,
              practice_id: row.practice ?? practice.id,
              performed_at: new Date(row.practiced_on).toISOString(),
              points_awarded: practice.base_points,
              notes: null
            } satisfies DevotionLogDto;
          });

          const totalPoints = logs.reduce((sum, entry) => sum + entry.points_awarded, 0);
          const streak = this.calculateStreak(logs.map((entry) => entry.performed_at));
          const level = Math.floor(totalPoints / 100) + 1;
          const meter = Math.min(100, totalPoints % 100);

          await this.client
            .from('user_spiritual_stats')
            .upsert({ user_id: userId, total_points: totalPoints, streak, level });

          return {
            total_points: totalPoints,
            streak,
            level,
            meter,
            last_practiced_at: logs[0]?.performed_at ?? null,
            recent_logs: logs.slice(0, 10)
          } satisfies DevotionSummaryDto;
        }
      } catch (error) {
        console.warn('[ExperienceService] Failed to compute devotion summary from Supabase:', error);
      }
    }

    const logs = this.devotionLogs.get(userId) ?? [];
    const totalPoints = logs.reduce((sum, entry) => sum + entry.points_awarded, 0);
    const lastLog = logs[0];
    const streak = this.calculateStreak(logs.map((entry) => entry.performed_at));
    const level = Math.floor(totalPoints / 100) + 1;
    const meter = Math.min(100, totalPoints % 100);

    return {
      total_points: totalPoints,
      streak,
      level,
      meter,
      last_practiced_at: lastLog?.performed_at ?? null,
      recent_logs: logs
    };
  }

  private buildEventDto(row: any, attendees: any[], userId?: string | null): EventDto {
    const validAttendees = Array.isArray(attendees) ? attendees.filter((attendee) => attendee.status !== 'not_going') : [];
    const attendeeCount = validAttendees.length;
    const isAttending = Boolean(
      userId && attendees.some((attendee) => attendee.user_id === userId && attendee.status !== 'not_going')
    );

    return {
      id: row.id,
      creator_id: row.organizer_id,
      title: row.title,
      description: row.description ?? null,
      start_at: row.start_time,
      end_at: row.end_time ?? null,
      location: row.location ?? null,
      tags: Array.isArray(row.tags) ? row.tags : [],
      capacity: row.capacity ?? null,
      attendees_count: attendeeCount,
      is_attending: isAttending
    } satisfies EventDto;
  }

  private async loadEventById(eventId: string, userId?: string | null): Promise<EventDto | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('events')
        .select('id, organizer_id, title, description, start_time, end_time, location, tags, capacity')
        .eq('id', eventId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const { data: attendees } = await this.client
        .from('event_attendees')
        .select('user_id, status')
        .eq('event_id', eventId);

      return this.buildEventDto(data, attendees ?? [], userId);
    } catch (err) {
      console.warn('[ExperienceService] Failed to load event by id:', err);
      return null;
    }
  }

  private calculateStreak(logEntries: string[]): number {
    if (!logEntries.length) return 0;
    const days = logEntries
      .map((entry) => new Date(entry))
      .sort((a, b) => Number(b) - Number(a))
      .map((date) => date.toISOString().slice(0, 10));

    const uniqueDays = Array.from(new Set(days));
    let streak = 0;
    const current = new Date();

    const containsDay = (day: string) => uniqueDays.includes(day);

    while (true) {
      const key = current.toISOString().slice(0, 10);
      if (containsDay(key)) {
        streak += 1;
        current.setDate(current.getDate() - 1);
      } else {
        // Allow missing today but streak includes yesterday onwards
        if (streak === 0) {
          current.setDate(current.getDate() - 1);
          const fallbackKey = current.toISOString().slice(0, 10);
          if (containsDay(fallbackKey)) {
            streak += 1;
            current.setDate(current.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return streak;
  }

  private formatDate(date: Date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}
