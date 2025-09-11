import React, { useState, useEffect, useCallback } from 'react';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';
import { Post } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const PostFeed: React.FC = () => {
  const { user } = useAuth();
  const hasSupabase = Boolean(supabase);
  const [posts, setPosts] = useState<Post[]>(hasSupabase ? [] : samplePosts);
  const [loading, setLoading] = useState(hasSupabase);

  const interestsKey = user?.interests?.join(',') || '';
  const userId = user?.id;

  const fetchPosts = useCallback(async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('posts')
        .select(`
          *,
          users(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      query = userId
        ? query.or(`moderation_status.eq.approved,user_id.eq.${encodeURIComponent(userId)}`)
        : query.eq('moderation_status', 'approved');

      const { data, error }: any = await query;

      if (error) throw error;

      let transformedPosts = (data || []).map((post: any) => ({
        ...post,
        user: post.users,
      }));

      if (interestsKey) {
        const interestSet = new Set(interestsKey.split(','));
        const preferred = transformedPosts.filter((p) => {
          const topicMatch = p.spiritual_topic && interestSet.has(p.spiritual_topic);
          const tagMatch = (p.tags || []).some((t: string) => interestSet.has(t));
          return topicMatch || tagMatch;
        });
        const others = transformedPosts.filter((p) => !preferred.includes(p));
        transformedPosts = [...preferred, ...others];
      }

      setPosts(transformedPosts.length ? transformedPosts : samplePosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts(samplePosts);
    } finally {
      setLoading(false);
    }
  }, [interestsKey, userId]);

  useEffect(() => {
    if (!hasSupabase) return;
    fetchPosts();
  }, [hasSupabase, fetchPosts]);

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
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <CreatePost onPostCreated={handlePostCreated} />
      
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdate={handlePostUpdate}
          />
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
    content: 'Just finished reading the Mandukya Upanishad. The four states of consciousness described are so profound. Om represents the entire cosmos and our journey through waking, dreaming, deep sleep, and the transcendent state. How has this teaching influenced your meditation practice?',
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
    content: 'Beautiful Navaratri celebration at our local temple today. The divine feminine energy was so palpable during the Durga Puja. Feeling blessed to witness such devotion and community spirit. The chanting of the Devi Mahatmya filled my heart with joy. 🌺',
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