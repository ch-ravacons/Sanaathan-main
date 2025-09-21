import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Medal, Sparkles, Activity } from 'lucide-react';

import { api, queryKeys, type DevotionPractice, type DevotionSummary } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

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
    onSuccess: () => {
      toast('Practice recorded. Keep shining! ✨', 'success');
      setNotes('');
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-600" /> Devotion Tracker
      </h3>

      {!user && (
        <p className="text-sm text-gray-500">Sign in to log your daily devotion practices.</p>
      )}

      {user && (
        <>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <label className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 mb-1">Choose a practice</span>
              <select
                className="border border-gray-200 rounded px-3 py-2 text-sm"
                value={selectedPracticeId ?? ''}
                onChange={(event) => setSelectedPracticeId(event.target.value || null)}
              >
                <option value="">Select practice…</option>
                {practices.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-xs font-medium text-gray-500">Intensity</span>
              <div className="mt-1 flex items-center gap-2">
                {(['light', 'medium', 'intense'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      intensity === level
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-orange-400'
                    }`}
                  >
                    {intensityLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 mb-1">Notes (optional)</span>
              <textarea
                rows={3}
                className="border border-gray-200 rounded px-3 py-2 text-sm resize-none"
                placeholder="What inspired your practice today?"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => logMutation.mutate()}
            disabled={!selectedPracticeId || logMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {logMutation.isPending ? 'Saving…' : 'Log Practice'}
          </button>

          {summary && (
            <div className="mt-6 bg-orange-50 border border-orange-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <Medal className="w-4 h-4" /> Your spiritual journey
              </h4>
              <dl className="grid grid-cols-2 gap-3 text-sm text-orange-900">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-orange-500">Total points</dt>
                  <dd className="text-lg font-semibold">{summary.total_points}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-orange-500">Streak</dt>
                  <dd className="text-lg font-semibold">{summary.streak} days</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-orange-500">Level</dt>
                  <dd className="text-lg font-semibold">{summary.level}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-orange-500">Spiritual meter</dt>
                  <dd className="text-lg font-semibold">{summary.meter ?? 0}%</dd>
                </div>
              </dl>
              {summary.recent_logs && summary.recent_logs.length > 0 && (
                <div className="mt-3 text-xs text-orange-700">
                  <p className="font-medium flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Recent practices
                  </p>
                  <ul className="mt-1 space-y-1">
                    {summary.recent_logs.slice(0, 3).map((log) => (
                      <li key={log.id}>
                        {new Date(log.performed_at).toLocaleDateString()} – {log.practice_id} (+{log.points_awarded})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
