import React, { useEffect } from 'react';
import { X, MapPin, Link as LinkIcon, MessageCircle, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '../../lib/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

const renderList = (label: string, items?: string[]) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-sand-500">{label}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} tone="neutral" size="sm">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const profileQuery = useQuery({
    queryKey: queryKeys.users.profile(userId),
    queryFn: () => api.getUserProfile(userId),
    enabled: Boolean(userId)
  });

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose]);

  const profile = profileQuery.data ?? null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sand-900/60 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Coach profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-sand-900">
              {profile?.spiritual_name || profile?.full_name || 'Spiritual guide'}
            </h2>
            {profile?.spiritual_path && (
              <p className="text-sm text-sand-600">Path • {profile.spiritual_path}</p>
            )}
            {profile?.location && (
              <p className="mt-2 flex items-center gap-2 text-sm text-sand-500">
                <MapPin className="h-4 w-4" /> {profile.location}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {profileQuery.isLoading && (
          <div className="mt-10 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-4 animate-pulse rounded bg-sand-200" />
            ))}
          </div>
        )}

        {!profileQuery.isLoading && !profile && (
          <p className="mt-10 text-sm text-sand-600">Unable to load this profile right now.</p>
        )}

        {profile && (
          <div className="mt-6 space-y-6">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-24 w-24 rounded-full border border-sand-200 object-cover"
              />
            )}

            {profile.introduction && (
              <div>
                <h3 className="text-sm font-semibold text-sand-800">Introduction</h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-600">{profile.introduction}</p>
              </div>
            )}

            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold text-sand-800">Bio</h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-600">{profile.bio}</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {renderList('Vedic Qualifications', profile.vedic_qualifications)}
              {renderList('Spiritual Qualifications', profile.spiritual_qualifications)}
              {renderList('Areas of Guidance', profile.areas_of_guidance)}
              {renderList('Languages', profile.languages_spoken)}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {profile.years_of_experience != null && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-sand-500">Experience</h4>
                  <p className="mt-2 flex items-center gap-2 text-sm text-sand-700">
                    <Award className="h-4 w-4" /> {profile.years_of_experience} years supporting seekers
                  </p>
                </div>
              )}
              {profile.availability && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-sand-500">Availability</h4>
                  <p className="mt-2 text-sm text-sand-700">{profile.availability}</p>
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {profile.achievements && profile.achievements.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-sand-500">Highlights</h4>
                  <ul className="mt-2 space-y-2 text-sm text-sand-700">
                    {profile.achievements.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.offerings && profile.offerings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-sand-500">Offerings</h4>
                  <ul className="mt-2 space-y-2 text-sm text-sand-700">
                    {profile.offerings.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.certifications && profile.certifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-sand-500">Certifications</h4>
                  <ul className="mt-2 space-y-2 text-sm text-sand-700">
                    {profile.certifications.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sand-200 px-3 py-1.5 text-sm text-brand-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <LinkIcon className="h-4 w-4" /> Website
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sand-200 px-3 py-1.5 text-sm text-brand-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <LinkIcon className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {profile.whatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sand-200 px-3 py-1.5 text-sm text-brand-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
