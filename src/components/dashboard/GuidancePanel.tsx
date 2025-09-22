import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, Loader2 } from 'lucide-react';

import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

interface GuidancePanelProps {
  defaultPrompt?: string;
}

export const GuidancePanel: React.FC<GuidancePanelProps> = ({ defaultPrompt = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState(defaultPrompt);
  const [response, setResponse] = useState<string | null>(null);

  const askMutation = useMutation({
    mutationFn: async () => {
      if (!question.trim()) {
        throw new Error('Ask a spiritual question to receive guidance.');
      }
      const result = await api.askAgent({
        agent: 'guidance',
        query: question.trim(),
        userId: user?.id
      });
      return result;
    },
    onSuccess: (data) => {
      setResponse(typeof data.message === 'string' ? data.message : JSON.stringify(data));
    },
    onError: (error: any) => {
      toast(error?.message ?? 'Unable to fetch guidance right now.', 'error');
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Guidance Bot</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Ask a question about scriptures, practices, or the path you follow and receive curated insights from community knowledge.
      </p>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        placeholder="e.g., How do I deepen my meditation practice?"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      />
      <ButtonRow
        onSubmit={() => askMutation.mutate()}
        loading={askMutation.isPending}
      />
      {response && (
        <div className="mt-4 p-3 rounded bg-purple-50 border border-purple-100 text-sm text-purple-900 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
};

interface ButtonRowProps {
  onSubmit: () => void;
  loading: boolean;
}

const ButtonRow: React.FC<ButtonRowProps> = ({ onSubmit, loading }) => (
  <div className="flex justify-end mt-3">
    <button
      type="button"
      onClick={onSubmit}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Guidance
    </button>
  </div>
);
