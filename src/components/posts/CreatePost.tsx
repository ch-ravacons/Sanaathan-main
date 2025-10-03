import React, { useState, useCallback, useMemo } from 'react';
import { useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, Lightbulb, Paperclip, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
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

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = (event) => reject(event);
    reader.readAsDataURL(file);
  });

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

        if (uploadInfo.uploadUrl.includes('uploads.sanaathan.local')) {
          const inlineUrl = await readFileAsDataUrl(file);
          mediaPayload.push({
            assetId: uploadInfo.assetId,
            type,
            metadata: {
              originalName: file.name,
              size: file.size,
              mimeType: file.type,
              url: inlineUrl,
              path: uploadInfo.path,
              inline: true
            }
          });
          continue;
        }

        let uploadResponse: Response;
        const lowerCaseHeaders = Object.fromEntries(
          Object.entries(uploadInfo.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value])
        );

        {
          const headers: Record<string, string> = {};
          Object.entries(lowerCaseHeaders).forEach(([key, value]) => {
            if (key !== 'content-type') {
              headers[key] = value;
            }
          });
          if (!headers['x-upsert']) {
            headers['x-upsert'] = 'true';
          }

          const formData = new FormData();
          formData.append('cacheControl', '3600');
          formData.append('', file, file.name);

          uploadResponse = await fetch(uploadInfo.uploadUrl, {
            method: 'PUT',
            headers,
            body: formData
          });
        }

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => null);
          throw new Error(errorText || 'Failed to upload media');
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
    <Card padding="md" className="mb-6 space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-sand-900">Share Your Spiritual Insights</h3>
          <p className="text-sm text-sand-600">Offer your wisdom or seek guidance from the community.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowGuidelines(!showGuidelines)}>
          <Lightbulb className="h-4 w-4" />
          Guidelines
        </Button>
      </div>

      {showGuidelines && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/80 p-4">
          <h4 className="text-sm font-semibold text-brand-700">Community Guidelines</h4>
          <ul className="mt-2 space-y-1 text-sm text-brand-800">
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
            <label className="mb-1 block text-sm font-medium text-sand-700">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="meditation, wisdom, experience (comma-separated)"
              className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
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
          <span className="text-xs text-sand-400">
            {attachments.length}/{MAX_ATTACHMENTS} attachments
          </span>
        </div>

        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.map((attachment, index) => {
              const isVideo = attachment.file.type.startsWith('video/');
              return (
                <div key={`${attachment.preview}-${index}`} className="relative overflow-hidden rounded-2xl border border-sand-200 bg-sand-25 group">
                  {isVideo ? (
                    <video src={attachment.preview} className="w-full h-40 object-cover bg-black" controls />
                  ) : (
                    <img src={attachment.preview} alt={attachment.file.name} className="w-full h-40 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="absolute right-2 top-2 rounded-full bg-white/85 p-1 text-sand-600 transition hover:text-brand-600"
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
          <label className="mb-2 block text-sm font-medium text-sand-700">
            Your Message
          </label>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-sand-200 px-3 py-2 text-sm text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
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

        <div className="flex items-center justify-between">
          <div className="text-sm text-sand-500">
            {content.length}/1000 characters
          </div>
          <Button
            type="submit"
            loading={loading}
            disabled={!content.trim() || content.trim().length < 10 || content.length > 1000}
          >
            <Send className="h-4 w-4" />
            Share Post
          </Button>
        </div>
      </form>
    </Card>
  );
};
