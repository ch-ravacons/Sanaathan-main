import React, { useState, useCallback, useMemo } from 'react';
import { useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, Lightbulb, Paperclip, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { spiritualTopics } from '../../data/spiritualTopics';
import { moderateContent, generateContentSuggestions } from '../../utils/contentModeration';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';

interface CreatePostProps {
  onPostCreated: () => void;
}

interface Attachment {
  file: File;
  preview: string;
}

const MAX_ATTACHMENTS = 3;

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [moderation, setModeration] = useState<any>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const effectiveUserId = user?.id || session?.user?.id || null;

  const handleContentChange = (value: string) => {
    setContent(value);
    if (value.trim().length > 10) {
      const moderationResult = moderateContent(value);
      setModeration(moderationResult);
    } else {
      setModeration(null);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const accepted = files.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (accepted.length !== files.length) {
      toast('Only image and video files are supported.', 'warning');
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) {
      toast(`You can attach up to ${MAX_ATTACHMENTS} files.`, 'info');
      return;
    }

    const toAdd = accepted.slice(0, remainingSlots).map((file) => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    if (toAdd.length < accepted.length) {
      toast(`Only the first ${remainingSlots} file(s) were attached.`, 'info');
    }

    setAttachments((prev) => [...prev, ...toAdd]);
    event.target.value = '';
  }, [attachments.length, toast]);

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => URL.revokeObjectURL(attachment.preview));
    };
  }, [attachments]);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (content.trim().length < 10) {
      toast('Please enter at least 10 characters to post.', 'warning');
      return;
    }

    if (!effectiveUserId) {
      toast('You must be signed in to create a post.', 'warning');
      return;
    }

    const moderationResult = moderateContent(content);
    setLoading(true);

    try {
      const tagsArray = tags.split(',').map((tag) => tag.trim()).filter(Boolean);

      const mediaPayload: Array<{ assetId: string; type: 'image' | 'video'; metadata?: Record<string, unknown> }> = [];

      for (const attachment of attachments) {
        const file = attachment.file;
        const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';

        const uploadInfo = await api.getUploadUrl({
          userId: effectiveUserId,
          mediaType: type,
          fileName: file.name
        });

        const uploadResponse = await fetch(uploadInfo.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            ...(uploadInfo.headers ?? {})
          },
          body: file
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload media');
        }

        mediaPayload.push({
          assetId: uploadInfo.assetId,
          type,
          metadata: {
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            url: uploadInfo.publicUrl ?? null,
            path: uploadInfo.path
          }
        });
      }

      await api.createPost({
        userId: effectiveUserId,
        content: content.trim(),
        spiritualTopic: selectedTopic || null,
        tags: tagsArray,
        media: mediaPayload
      });

      setContent('');
      setSelectedTopic('');
      setTags('');
      setModeration(null);
      attachments.forEach((item) => URL.revokeObjectURL(item.preview));
      setAttachments([]);
      onPostCreated();

      if (!moderationResult.isAppropriate || moderationResult.score < 5) {
        toast('Post submitted for review. It will appear once approved.', 'info');
      } else {
        toast('Your post has been published!', 'success');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      const message = error?.message || String(error);
      toast(`Failed to create post: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = useMemo(() => (
    selectedTopic ? generateContentSuggestions(selectedTopic) : []
  ), [selectedTopic]);

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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-orange-600 cursor-pointer">
            <Paperclip className="w-4 h-4" /> Attach media
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <span className="text-xs text-gray-400">
            {attachments.length}/{MAX_ATTACHMENTS} attachments
          </span>
        </div>

        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.map((attachment, index) => {
              const isVideo = attachment.file.type.startsWith('video/');
              return (
                <div key={`${attachment.preview}-${index}`} className="relative border border-gray-200 rounded-lg overflow-hidden group">
                  {isVideo ? (
                    <video src={attachment.preview} className="w-full h-40 object-cover bg-black" controls />
                  ) : (
                    <img src={attachment.preview} alt={attachment.file.name} className="w-full h-40 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-700 hover:text-red-600"
                    aria-label="Remove attachment"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
          <div
            className={`p-3 rounded-lg border ${
              moderation.isAppropriate ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              {moderation.isAppropriate ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  moderation.isAppropriate ? 'text-green-900' : 'text-red-900'
                }`}
              >
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
