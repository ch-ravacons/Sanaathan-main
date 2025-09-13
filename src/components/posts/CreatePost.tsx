import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { spiritualTopics } from '../../data/spiritualTopics';
import { moderateContent, generateContentSuggestions } from '../../utils/contentModeration';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

interface CreatePostProps {
  onPostCreated: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [moderation, setModeration] = useState<any>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (value.trim().length > 10) {
      const moderationResult = moderateContent(value);
      setModeration(moderationResult);
    } else {
      setModeration(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (content.trim().length < 10) {
      toast('Please enter at least 10 characters to post.', 'warning');
      return;
    }

    const moderationResult = moderateContent(content);

    setLoading(true);

    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

      if (!supabase) {
        toast('Database connection not available. Please check your Supabase configuration.', 'error');
        setLoading(false);
        return;
      }

      // If context user is not yet ready, fall back to auth API
      let effectiveUserId = user?.id;
      if (!effectiveUserId) {
        const { data: authData } = await supabase.auth.getUser();
        effectiveUserId = authData?.user?.id;
        if (!effectiveUserId) {
          toast('You must be signed in to create a post.', 'warning');
          setLoading(false);
          return;
        }
      }

      // Ensure user profile exists to satisfy FK posts.user_id -> users.id
      try {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', effectiveUserId)
          .maybeSingle();

        if (!existingProfile) {
          const { data: authData } = await supabase.auth.getUser();
          const authUser = authData?.user;
          const email = authUser?.email || user?.email || '';
          const fallbackName = (authUser?.user_metadata?.full_name || user?.full_name || email || 'User').toString();

          const { error: profileInsertError } = await supabase
            .from('users')
            .insert([
              {
                id: effectiveUserId,
                email,
                full_name: fallbackName,
                interests: [],
                spiritual_path: '',
                path_practices: [],
              },
            ]);
          if (profileInsertError) {
            console.warn('Profile insert failed (non-fatal for post create):', profileInsertError.message || profileInsertError);
          }
        }
      } catch (profileErr) {
        console.warn('Profile ensure threw (non-fatal):', profileErr);
      }

      const { error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: effectiveUserId!,
            content: content.trim(),
            spiritual_topic: selectedTopic || null,
            tags: tagsArray,
            moderation_status: moderationResult.isAppropriate && moderationResult.score >= 5 ? 'approved' : 'pending',
          },
        ]);

      if (error) throw error;

      setContent('');
      setSelectedTopic('');
      setTags('');
      setModeration(null);
      onPostCreated();

      if (!moderationResult.isAppropriate || moderationResult.score < 5) {
        toast('Post submitted for review. It will be visible once approved.', 'info');
      } else {
        toast('Your post has been published!', 'success');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      const message = error?.message || String(error);
      // Friendly hints for common failures
      if (message.includes('foreign key constraint')) {
        toast('Profile not ready. Sign out and sign in again, then retry posting.', 'warning');
      } else if (message.includes('length') || message.includes('check constraint')) {
        toast('Message must be between 10 and 1000 characters.', 'warning');
      } else if (message.toLowerCase().includes('rls')) {
        toast('Permission error while creating post. Please ensure you are signed in.', 'error');
      } else {
        toast(`Failed to create post: ${message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const suggestions = selectedTopic ? generateContentSuggestions(selectedTopic) : [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Share Your Spiritual Insights</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGuidelines(!showGuidelines)}
        >
          <Lightbulb className="w-4 h-4 mr-1" />
          Guidelines
        </Button>
      </div>

      {showGuidelines && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">Community Guidelines</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Share authentic spiritual experiences and insights</li>
            <li>• Ask thoughtful questions to learn from others</li>
            <li>• Respect all spiritual paths and traditions</li>
            <li>• Use respectful language and avoid negativity</li>
            <li>• Focus on personal growth and wisdom sharing</li>
            <li>• Cite sources when sharing scriptural knowledge</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Spiritual Topic (Optional)"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">Select a topic</option>
            {Object.entries(
              spiritualTopics.reduce((acc, topic) => {
                if (!acc[topic.category]) acc[topic.category] = [];
                acc[topic.category].push(topic);
                return acc;
              }, {} as Record<string, typeof spiritualTopics>)
            ).map(([category, topics]) => (
              <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="meditation, wisdom, experience (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Content Suggestions:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Message
          </label>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            placeholder="Share your spiritual insights, experiences, or questions with the community..."
            required
          />
        </div>

        {moderation && (
          <div className={`p-3 rounded-lg border ${
            moderation.isAppropriate 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {moderation.isAppropriate ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                moderation.isAppropriate ? 'text-green-900' : 'text-red-900'
              }`}>
                Content {moderation.isAppropriate ? 'looks good!' : 'needs review'}
              </span>
            </div>
            
            {moderation.flags.length > 0 && (
              <ul className="text-sm text-red-800 space-y-1 mb-2">
                {moderation.flags.map((flag: string, index: number) => (
                  <li key={index}>• {flag}</li>
                ))}
              </ul>
            )}
            
            {moderation.suggestions && (
              <ul className="text-sm text-orange-800 space-y-1">
                {moderation.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>💡 {suggestion}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {content.length}/1000 characters
          </div>
          <Button
            type="submit"
            loading={loading}
            disabled={!content.trim() || content.trim().length < 10 || content.length > 1000}
          >
            <Send className="w-4 h-4 mr-2" />
            Share Post
          </Button>
        </div>
      </form>
    </div>
  );
};
