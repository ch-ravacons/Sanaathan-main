import React, { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SuggestedConnection } from '../../lib/api';
import { X } from 'lucide-react';

interface SuggestedConnectionsModalProps {
  suggestions: SuggestedConnection[];
  onClose: () => void;
  onViewProfile: (userId: string) => void;
  onToggleFollow: (connection: SuggestedConnection) => void;
  isFollowPending: (userId: string) => boolean;
}

export const SuggestedConnectionsModal: React.FC<SuggestedConnectionsModalProps> = ({
  suggestions,
  onClose,
  onViewProfile,
  onToggleFollow,
  isFollowPending
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-sand-900/60 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Connections</p>
            <h2 className="mt-1 text-2xl font-semibold text-sand-900">Seers & guides you may know</h2>
            <p className="mt-2 text-sm text-sand-600">
              Refine your circle with mentors who share your path and interests.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {suggestions.map((connection) => {
            const displayName = connection.full_name || connection.spiritual_path || 'Spiritual seeker';
            const chips: string[] = [];
            (connection.shared_interests ?? []).slice(0, 2).forEach((interest) => chips.push(`#${interest}`));
            (connection.areas_of_guidance ?? []).slice(0, 3).forEach((area) => chips.push(area));
            (connection.languages_spoken ?? []).slice(0, 2).forEach((lang) => chips.push(`Speaks ${lang}`));

            return (
              <div
                key={connection.id}
                className="rounded-3xl border border-brand-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-base font-semibold uppercase text-white">
                    {displayName.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-sand-900">{displayName}</h3>
                        <p className="truncate text-xs text-sand-500">{connection.spiritual_path ?? 'Seeker'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sand-500">
                          {connection.location && <span>{connection.location}</span>}
                          {connection.years_of_experience != null && (
                            <span>{connection.years_of_experience} yrs experience</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={connection.is_following ? 'ghost' : 'outline'}
                        className="min-w-[112px] justify-center"
                        loading={isFollowPending(connection.id)}
                        onClick={() => onToggleFollow(connection)}
                      >
                        {connection.is_following ? 'Following' : 'Follow'}
                      </Button>
                    </div>

                    {connection.introduction && (
                      <p className="text-sm leading-relaxed text-sand-600">{connection.introduction}</p>
                    )}

                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {chips.map((chip) => (
                          <Badge key={`${connection.id}-${chip}`} tone="neutral" size="sm">
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-sand-500">
                      {connection.vedic_qualifications && connection.vedic_qualifications.length > 0 && (
                        <span>Vedic studies: {connection.vedic_qualifications.join(', ')}</span>
                      )}
                      {connection.spiritual_qualifications && connection.spiritual_qualifications.length > 0 && (
                        <span>Lineage: {connection.spiritual_qualifications.join(', ')}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-xs text-brand-600 hover:text-brand-700"
                        onClick={() => {
                          onClose();
                          onViewProfile(connection.id);
                        }}
                      >
                        View full profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {suggestions.length === 0 && (
            <p className="text-sm text-sand-600">No suggestions available at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
};
