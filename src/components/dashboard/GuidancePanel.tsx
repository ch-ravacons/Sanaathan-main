import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot } from 'lucide-react';

import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

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
    <Card padding="md" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-500" />
          <h3 className="text-lg font-semibold text-sand-900">Guidance Bot</h3>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-sand-600">
        Ask a question about scriptures, practices, or your path and receive curated insights from our collective wisdom.
      </p>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        placeholder="e.g., How do I deepen my meditation practice?"
        className="w-full rounded-xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
      <div className="flex justify-end">
        <Button type="button" variant="primary" size="sm" loading={askMutation.isPending} onClick={() => askMutation.mutate()}>
          <Send className="h-4 w-4" /> Guidance
        </Button>
      </div>
      {response && (
        <div className="rounded-2xl border border-moss-200 bg-moss-50/70 p-4 text-sm text-moss-800 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </Card>
  );
};
