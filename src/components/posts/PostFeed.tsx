import React, { useState, useEffect, useCallback } from 'react';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';
import { Post } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

export const PostFeed: React.FC = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const hasSupabase = Boolean(supabase);
  const [posts, setPosts] = useState<Post[]>(hasSupabase ? [] : samplePosts);
  const [loading, setLoading] = useState<boolean>(hasSupabase);
  const [usingSample, setUsingSample] = useState<boolean>(!hasSupabase);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const interestsKey = user?.interests?.join(',') || '';
  // Prefer profile id; fall back to auth session id in case profile hasn't loaded yet
  const effectiveUserId = user?.id || session?.user?.id || null;

  const fetchPosts = useCallback(async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Build query based on tab
      let query = supabase
        .from('posts')
        .select(`
          *,
          users(*)
        `);

      if (activeTab === 'mine') {
        if (!effectiveUserId) {
          setPosts([]);
          setUsingSample(false);
          toast('Sign in to view your posts.', 'info');
          return;
        }
        query = query.eq('user_id', effectiveUserId);
      } else {
        // All posts: show approved for everyone; include my own if signed in
        if (effectiveUserId) {
          query = query.or(`moderation_status.eq.approved,user_id.eq.${effectiveUserId}`);
        } else {
          query = query.eq('moderation_status', 'approved');
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Map joined user object
      let transformedPosts: Post[] = (data ?? []).map((post: any) => ({
        ...post,
        user: post.users, // keep your Post.user shape
      }));

      // Optional interests-based prioritization
      if (interestsKey) {
        const interestSet = new Set(interestsKey.split(',').map((s) => s.trim()).filter(Boolean));
        const preferred = transformedPosts.filter((p: any) => {
          const topicMatch = p.spiritual_topic && interestSet.has(p.spiritual_topic);
          const tagMatch = Array.isArray(p.tags) && p.tags.some((t: string) => interestSet.has(t));
          return topicMatch || tagMatch;
        });
        const others = transformedPosts.filter((p) => !preferred.includes(p));
        transformedPosts = [...preferred, ...others];
      }

      if (transformedPosts.length) {
        setPosts(transformedPosts);
        setUsingSample(false);
      } else {
        // No live posts yet; show empty state (not sample data)
        setPosts([]);
        setUsingSample(false);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts(samplePosts);
      setUsingSample(true);
    } finally {
      setLoading(false);
    }
  }, [interestsKey, effectiveUserId, activeTab]);

  useEffect(() => {
    if (!hasSupabase) return;
    if (authLoading) return; // wait for session to restore so RLS includes my pending posts
    fetchPosts();

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [hasSupabase, authLoading, session?.user?.id, effectiveUserId, activeTab, fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostUpdate = () => {
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32" />
                <div className="h-3 bg-gray-300 rounded w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Tabs */}
      <div className="mb-4">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 text-sm rounded-md ${
              activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-1.5 text-sm rounded-md ${
              activeTab === 'mine' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={!(user || session)}
          >
            My Posts
          </button>
        </div>
      </div>

      {usingSample && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
          Showing sample posts (live data unavailable). Check Supabase config or network.
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🕉️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share your spiritual insights with the community!</p>
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
    user: {
      id: 'sample1',
      email: 'swami@example.com',
      full_name: 'Swami Ananda',
      spiritual_name: 'Swami Ananda',
      spiritual_path: 'Advaita Vedanta',
      interests: ['upanishads', 'meditation'],
      path_practices: ['Meditation', 'Self-Inquiry'],
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
    user: {
      id: 'sample2',
      email: 'devi@example.com',
      full_name: 'Devi Priya',
      spiritual_name: 'Devi Priya',
      spiritual_path: 'Shakteya',
      interests: ['festivals', 'bhakti'],
      path_practices: ['Devi Puja', 'Mantra'],
      created_at: '',
      updated_at: '',
    },
  },
];
