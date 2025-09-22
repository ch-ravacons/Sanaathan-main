import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Flag, MoreHorizontal, ImageOff } from 'lucide-react';
import { Post, PostMedia } from '../../types';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { spiritualTopics } from '../../data/spiritualTopics';

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

  const topic = post.spiritual_topic ?
    spiritualTopics.find(t => t.id === post.spiritual_topic) : null;

  const safeTags = Array.isArray(post.tags) ? post.tags : [];
  const likes = typeof post.likes_count === 'number' ? post.likes_count : 0;
  const comments = typeof post.comments_count === 'number' ? post.comments_count : 0;
  const shares = typeof post.shares_count === 'number' ? post.shares_count : 0;

  const handleLike = async () => {
    if (!user) return;
    if (likeLoading) return;

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
        await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);
      }
      
      setLiked(!liked);
      onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      if (!supabase) {
        toast('Database connection not available', 'error');
        return;
      }

      await supabase
        .from('comments')
        .insert([{
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim(),
        }]);

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

      await supabase
        .from('post_reports')
        .insert([{
          post_id: post.id,
          reported_by: user.id,
          reason: reason.trim(),
        }]);

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {post.user?.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.full_name ?? 'Profile'}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {(post.user?.spiritual_name || post.user?.full_name || 'U').charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {post.user?.spiritual_name || post.user?.full_name || 'Anonymous'}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{post.user?.spiritual_path}</span>
              <span>•</span>
              <span>{formatTime(post.created_at)}</span>
              {post.moderation_status === 'pending' && (
                <>
                  <span>•</span>
                  <span className="text-orange-600">Pending Review</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {topic && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              {topic.name}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleReport}>
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 space-y-3">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {attachments.length > 0 && (
          <div className={`grid gap-3 ${attachments.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {attachments.map((media) => {
              if (!media.url) {
                return (
                  <div key={media.id} className="flex items-center justify-center h-48 bg-gray-100 text-gray-400 rounded-lg border border-dashed">
                    <ImageOff className="w-6 h-6" />
                  </div>
                );
              }
              return media.media_type === 'video' ? (
                <video
                  key={media.id}
                  className="w-full h-48 rounded-lg border border-gray-200 object-cover bg-black"
                  controls
                  src={media.url}
                />
              ) : (
                <img
                  key={media.id}
                  src={media.url}
                  alt={media.metadata?.originalName?.toString() ?? 'Post attachment'}
                  className="w-full h-48 rounded-lg border border-gray-200 object-cover"
                  loading="lazy"
                />
              );
            })}
          </div>
        )}

        {safeTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {safeTags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{comments}</span>
          </button>
          
          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm">{shares}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(user?.spiritual_name || user?.full_name || 'U').charAt(0)}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts respectfully..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!newComment.trim()}
              >
                Reply
              </Button>
            </div>
          </form>
          
          <div className="text-sm text-gray-500 text-center py-4">
            Comments will be loaded here once the backend is fully connected
          </div>
        </div>
      )}
    </div>
  );
};
