import React, { useState, useEffect, useCallback } from 'react';

import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';

const generateClientId = () =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);

interface PostFeedProps {
  topicFilter?: string | null;
  onTopicFilterClear?: () => void;
}

export const PostFeed: React.FC<PostFeedProps> = ({ topicFilter, onTopicFilterClear }) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [loading, setLoading] = useState<boolean>(true);
  const [usingSample, setUsingSample] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const interestsKey = user?.interests?.join(',') || '';
  const effectiveUserId = user?.id || session?.user?.id || null;

  const fetchPosts = useCallback(async () => {
    if (activeTab === 'mine' && !effectiveUserId) {
      setPosts([]);
      setUsingSample(false);
      setLoading(false);
      toast('Sign in to view your posts.', 'info');
      return;
    }

    setLoading(true);

    try {
      const response = await api.listPosts({
        userId: effectiveUserId ?? undefined,
        interests: interestsKey ? interestsKey.split(',').filter(Boolean) : undefined,
        limit: 20,
        mine: activeTab === 'mine'
      });

      const normalized: Post[] = (response.posts ?? []).map((post: any) => ({
        ...post,
        user: post.user ?? post.author ?? undefined,
        created_at: post.created_at ?? post.createdAt,
        updated_at: post.updated_at ?? post.updatedAt,
        tags: Array.isArray(post.tags) ? post.tags : [],
        media: Array.isArray(post.media)
          ? post.media.map((item: any) => ({
              id: item.id ?? item.assetId ?? generateClientId(),
              url: item.url ?? item.publicUrl ?? '',
              media_type: item.media_type ?? item.mediaType ?? 'image',
              metadata: item.metadata ?? null,
              storage_bucket: item.storage_bucket ?? null
            }))
          : []
      }));

      let transformedPosts = normalized;

      if (interestsKey && normalized.length) {
        const interestSet = new Set(interestsKey.split(',').map((s) => s.trim()).filter(Boolean));
        const preferred = normalized.filter((p: any) => {
          const topicMatch = (p.spiritual_topic || p.spiritualTopic) && interestSet.has(p.spiritual_topic || p.spiritualTopic);
          const tagMatch = Array.isArray(p.tags) && p.tags.some((t: string) => interestSet.has(t));
          return topicMatch || tagMatch;
        });
        const others = normalized.filter((p) => !preferred.includes(p));
        transformedPosts = [...preferred, ...others];
      }

      if (topicFilter) {
        const filter = topicFilter.toLowerCase();
        transformedPosts = transformedPosts.filter((post) => {
          const tags = Array.isArray(post.tags) ? post.tags : [];
          const topicMatch = (post.spiritual_topic ?? '').toLowerCase() === filter;
          const tagMatch = tags.some((tag) => tag.toLowerCase() === filter);
          return topicMatch || tagMatch;
        });
      }

      setPosts(transformedPosts);
      setUsingSample(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts(samplePosts);
      setUsingSample(true);
    } finally {
      setLoading(false);
    }
  }, [activeTab, effectiveUserId, interestsKey, toast, topicFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostUpdate = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="mb-4 flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-sand-200" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-sand-200" />
                <div className="h-3 w-24 rounded bg-sand-200" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 rounded bg-sand-200" />
              <div className="h-4 w-3/4 rounded bg-sand-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <CreatePost onPostCreated={handlePostCreated} />

      {topicFilter && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-sm text-brand-800">
          <span>
            Filtering posts by <span className="font-semibold">#{topicFilter}</span>
          </span>
          {onTopicFilterClear && (
            <button
              type="button"
              onClick={onTopicFilterClear}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="inline-flex rounded-full bg-sand-100/70 p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              activeTab === 'all'
                ? 'bg-white text-sand-900 shadow-sm'
                : 'text-sand-600 hover:text-sand-800'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              activeTab === 'mine'
                ? 'bg-white text-sand-900 shadow-sm'
                : 'text-sand-600 hover:text-sand-800'
            }`}
            disabled={!(user || session)}
          >
            My Posts
          </button>
        </div>
      </div>

      {usingSample && (
        <div className="mb-4 rounded-2xl border border-sand-200 bg-sand-25 p-3 text-sand-700">
          Showing sample posts (live data unavailable). Check API connectivity or backend status.
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
        ))}

        {posts.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-brand-600">
              <span className="text-2xl">🕉️</span>
            </div>
            <h3 className="mb-2 text-lg font-medium text-sand-900">No posts yet</h3>
            <p className="text-sand-600">Be the first to share your spiritual insights with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sample posts for demo
const samplePosts: Post[] = [
  {
    id: '1',
    user_id: 'sample1',
    content:
      'Just finished reading the Mandukya Upanishad. The four states of consciousness described are so profound. Om represents the entire cosmos and our journey through waking, dreaming, deep sleep, and the transcendent state. How has this teaching influenced your meditation practice?',
    spiritual_topic: 'upanishads',
    tags: ['meditation', 'consciousness', 'om'],
    likes_count: 24,
    comments_count: 8,
    shares_count: 3,
    is_moderated: true,
    moderation_status: 'approved',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    media: [],
    user: {
      id: 'sample1',
      email: 'swami@example.com',
      full_name: 'Swami Ananda',
      spiritual_name: 'Swami Ananda',
      spiritual_path: 'Advaita Vedanta',
      interests: ['upanishads', 'meditation'],
      path_practices: ['Meditation', 'Self-Inquiry'],
      avatar_url: null,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: '2',
    user_id: 'sample2',
    content:
      'Beautiful Navaratri celebration at our local temple today. The divine feminine energy was so palpable during the Durga Puja. Feeling blessed to witness such devotion and community spirit. The chanting of the Devi Mahatmya filled my heart with joy. 🌺',
    spiritual_topic: 'festivals',
    tags: ['navaratri', 'durga', 'devotion'],
    likes_count: 45,
    comments_count: 12,
    shares_count: 7,
    is_moderated: true,
    moderation_status: 'approved',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    media: [],
    user: {
      id: 'sample2',
      email: 'devi@example.com',
      full_name: 'Devi Priya',
      spiritual_name: 'Devi Priya',
      spiritual_path: 'Shakteya',
      interests: ['festivals', 'bhakti'],
      path_practices: ['Devi Puja', 'Mantra'],
      avatar_url: null,
      created_at: '',
      updated_at: '',
    },
  },
];
