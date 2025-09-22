import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Medal, Sparkles, Activity } from 'lucide-react';

import { api, queryKeys, type DevotionPractice, type DevotionSummary } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PracticeOption extends DevotionPractice {
  label: string;
}

const intensityLabels: Record<'light' | 'medium' | 'intense', string> = {
  light: 'Light',
  medium: 'Medium',
  intense: 'Intense'
};

export const DevotionTracker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'intense'>('medium');
  const [notes, setNotes] = useState('');

  const practicesQuery = useQuery({
    queryKey: queryKeys.devotion.practices(),
    queryFn: () => api.getDevotionPractices()
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.devotion.summary(user?.id ?? null),
    queryFn: () => {
      if (!user?.id) throw new Error('Not signed in');
      return api.getDevotionSummary({ userId: user.id });
    },
    enabled: Boolean(user?.id)
  });

  const logMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedPracticeId) {
        throw new Error('Missing selection');
      }
      return api.logDevotionPractice({
        userId: user.id,
        practiceId: selectedPracticeId,
        performedAt: new Date().toISOString(),
        intensity,
        notes: notes.trim() || undefined
      });
    },
    onSuccess: (data) => {
      toast('Practice recorded. Keep shining! ✨', 'success');
      setNotes('');
      queryClient.setQueryData(queryKeys.devotion.summary(user?.id ?? null), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.devotion.summary(user?.id ?? null) });
    },
    onError: () => toast('Unable to log practice right now.', 'error')
  });

  const practices = useMemo<PracticeOption[]>(() => {
    const list = practicesQuery.data?.practices ?? [];
    if (list.length === 0) {
      return [
        {
          id: 'practice-1',
          name: 'Japa Meditation',
          description: '108 mantra repetitions',
          category: 'meditation',
          base_points: 20,
          icon: null,
          label: 'Japa Meditation'
        },
        {
          id: 'practice-2',
          name: 'Scripture Reading',
          description: 'Read for at least 15 minutes',
          category: 'study',
          base_points: 15,
          icon: null,
          label: 'Scripture Reading'
        }
      ];
    }
    return list.map((item) => ({ ...item, label: item.name }));
  }, [practicesQuery.data]);

  const summary: DevotionSummary | undefined = summaryQuery.data?.summary;

  return (
    <Card padding="md" className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            <Flame className="h-4 w-4" /> Devotion Tracker
          </p>
          <h3 className="text-lg font-semibold text-sand-900">Log today's spiritual practice</h3>
        </div>
        {summary && (
          <Badge tone="brand" size="sm">{summary.level}</Badge>
        )}
      </div>

      {!user && (
        <p className="rounded-2xl border border-sand-100 bg-sand-25 px-4 py-3 text-sm text-sand-600">
          Sign in to log your daily devotion practices.
        </p>
      )}

      {user && (
        <>
          <div className="grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-sand-500">Choose a practice</span>
              <select
                className="rounded-xl border border-sand-200 bg-white/80 px-4 py-2.5 text-sm text-sand-800 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
                value={selectedPracticeId ?? ''}
                onChange={(event) => setSelectedPracticeId(event.target.value || null)}
              >
                <option value="">Select practice...</option>
                {practices.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-sand-500">Intensity</span>
              <div className="mt-2 flex items-center gap-2">
                {(['light', 'medium', 'intense'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                      intensity === level
                        ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-soft'
                        : 'border-sand-200 text-sand-600 hover:border-brand-200 hover:text-brand-600'
                    }`}
                  >
                    {intensityLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-sand-500">Notes (optional)</span>
              <textarea
                rows={3}
                className="rounded-xl border border-sand-200 bg-white/70 px-4 py-2.5 text-sm text-sand-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                placeholder="What inspired your practice today?"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </div>

          <Button
            type="button"
            className="w-full"
            loading={logMutation.isPending}
            disabled={!selectedPracticeId || logMutation.isPending}
            onClick={() => logMutation.mutate()}
          >
            <Sparkles className="h-4 w-4" />
            {logMutation.isPending ? 'Saving...' : 'Log Practice'}
          </Button>

          {summary && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <Medal className="h-4 w-4" /> Your spiritual journey
              </h4>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-brand-800">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-500">Total points</dt>
                  <dd className="text-lg font-semibold">{summary.total_points}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-500">Streak</dt>
                  <dd className="text-lg font-semibold">{summary.streak} days</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-500">Level</dt>
                  <dd className="text-lg font-semibold">{summary.level}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-brand-500">Spiritual meter</dt>
                  <dd className="text-lg font-semibold">{summary.meter ?? 0}%</dd>
                </div>
              </dl>
              {summary.recent_logs && summary.recent_logs.length > 0 && (
                <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs text-brand-900">
                  <p className="flex items-center gap-2 font-medium">
                    <Activity className="h-3 w-3" /> Recent practices
                  </p>
                  <ul className="mt-2 space-y-1">
                    {summary.recent_logs.slice(0, 3).map((log) => (
                      <li key={log.id}>
                        {new Date(log.performed_at).toLocaleDateString()} - {log.practice_id} (+{log.points_awarded})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
};
