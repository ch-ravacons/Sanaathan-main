import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Flag, ImageOff } from 'lucide-react';

import { Post, PostMedia } from '../../types';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { spiritualTopics } from '../../data/spiritualTopics';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const topic = post.spiritual_topic ? spiritualTopics.find((t) => t.id === post.spiritual_topic) : null;

  const safeTags = Array.isArray(post.tags) ? post.tags : [];
  const likes = typeof post.likes_count === 'number' ? post.likes_count : 0;
  const comments = typeof post.comments_count === 'number' ? post.comments_count : 0;
  const shares = typeof post.shares_count === 'number' ? post.shares_count : 0;

  const handleLike = async () => {
    if (!user || likeLoading) return;

    setLikeLoading(true);
    try {
      if (!supabase) {
        toast('Database connection not available', 'error');
        return;
      }

      if (liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert([{ post_id: post.id, user_id: user.id }]);
      }

      setLiked(!liked);
      onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      if (!supabase) {
        toast('Database connection not available', 'error');
        return;
      }

      await supabase.from('comments').insert([
        {
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim()
        }
      ]);

      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user) return;

    const reason = prompt('Please specify the reason for reporting this post:');
    if (!reason) return;

    try {
      if (!supabase) {
        toast('Database connection not available', 'error');
        return;
      }

      await supabase.from('post_reports').insert([
        {
          post_id: post.id,
          reported_by: user.id,
          reason: reason.trim()
        }
      ]);

      toast('Post reported. Our moderation team will review it.', 'info');
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const attachments: PostMedia[] = Array.isArray(post.media) ? post.media : [];
  const displayName = post.user?.spiritual_name || post.user?.full_name || 'Anonymous';
  const avatarFallback = (post.user?.spiritual_name || post.user?.full_name || 'U').charAt(0);

  return (
    <Card padding="md" className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {post.user?.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={displayName}
              className="h-12 w-12 rounded-full border border-sand-100 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-base font-semibold text-white">
              {avatarFallback}
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-sand-900">{displayName}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sand-500">
              {post.user?.spiritual_path && <span>{post.user.spiritual_path}</span>}
              <span>{formatTime(post.created_at)}</span>
              {post.moderation_status === 'pending' && <Badge tone="neutral" size="sm">Pending review</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {topic && <Badge tone="brand" size="sm">#{topic.name}</Badge>}
          <Button variant="ghost" size="sm" onClick={handleReport}>
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-sand-700 whitespace-pre-wrap">{post.content}</p>

        {attachments.length > 0 && (
          <div className={`grid gap-3 ${attachments.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {attachments.map((media) => {
              if (!media.url) {
                return (
                  <div
                    key={media.id}
                    className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-sand-200 bg-sand-25 text-sand-400"
                  >
                    <ImageOff className="h-6 w-6" />
                  </div>
                );
              }

              if ((media as any).type === 'video' || (media as any).media_type === 'video') {
                return (
                  <video
                    key={media.id}
                    className="max-h-[512px] w-full rounded-2xl border border-sand-100 bg-black object-contain"
                    controls
                    src={media.url}
                  />
                );
              }

              return (
                <img
                  key={media.id}
                  src={media.url}
                  alt={media.metadata?.originalName?.toString() ?? 'Post attachment'}
                  className="max-h-[512px] w-full rounded-2xl border border-sand-100 object-contain"
                  loading="lazy"
                />
              );
            })}
          </div>
        )}

        {safeTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {safeTags.map((tag, index) => (
              <Badge key={index} tone="neutral" size="sm">#{tag}</Badge>
            ))}
          </div>
        )}
      </section>

      <div className="soft-divider" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-medium transition ${
              liked ? 'text-brand-600' : 'text-sand-500 hover:text-brand-600'
            }`}
            disabled={likeLoading}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </button>

          <button
            onClick={() => setShowComments((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-sand-500 transition hover:text-moss-600"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{comments}</span>
          </button>

          <button className="flex items-center gap-2 text-sm font-medium text-sand-500 transition hover:text-sand-700">
            <Share2 className="h-5 w-5" />
            <span>{shares}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="space-y-4 rounded-2xl border border-sand-100 bg-sand-25/80 p-4">
          <form onSubmit={handleComment} className="flex flex-wrap items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
              {(user?.spiritual_name || user?.full_name || 'U').charAt(0)}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Share your thoughts respectfully..."
              className="flex-1 rounded-full border border-sand-200 px-4 py-2 text-sm text-sand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <Button type="submit" size="sm" loading={loading} disabled={!newComment.trim()}>
              Reply
            </Button>
          </form>

          <p className="text-center text-xs text-sand-500">
            Comments will appear here once the backend is connected.
          </p>
        </div>
      )}
    </Card>
  );
};
