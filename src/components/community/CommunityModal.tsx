import React, { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { api, queryKeys, type CommunityMember } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CommunityModalProps {
  interest: string | null;
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({ interest, onClose, onViewProfile }) => {
  const communityQuery = useInfiniteQuery({
    queryKey: queryKeys.communityInfinite(interest),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.getCommunityMembers({ interest: interest ?? undefined, cursor: pageParam ?? undefined, limit: 12 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const members: CommunityMember[] = communityQuery.data?.pages.flatMap((page) => page.members ?? []) ?? [];

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-sand-900/60 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Community</p>
            <h2 className="mt-1 text-2xl font-semibold text-sand-900">Spiritual seekers and guides</h2>
            <p className="mt-2 text-sm text-sand-600">
              {interest ? `Curated around ${interest}` : 'Discover mentors aligned with your path.'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {communityQuery.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-sand-100" />
              ))}
            </div>
          )}

          {!communityQuery.isLoading && members.length === 0 && (
            <p className="text-sm text-sand-600">No community members found for this selection yet.</p>
          )}

          {members.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-sand-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-sand-900">{member.full_name}</h3>
                      <p className="truncate text-xs text-sand-500">{member.spiritual_path ?? 'Seeker'}</p>
                      {member.location && (
                        <p className="truncate text-xs text-sand-500">{member.location}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        onClose();
                        onViewProfile(member.id);
                      }}
                    >
                      Profile
                    </Button>
                  </div>

                  {member.introduction && (
                    <p className="mt-3 line-clamp-3 text-sm text-sand-600">{member.introduction}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(member.areas_of_guidance ?? []).slice(0, 4).map((area) => (
                      <Badge key={area} tone="neutral" size="sm">
                        {area}
                      </Badge>
                    ))}
                  </div>

                  {member.vedic_qualifications && member.vedic_qualifications.length > 0 && (
                    <p className="mt-3 text-xs text-sand-500">
                      Vedic studies: {member.vedic_qualifications.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {communityQuery.hasNextPage && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => communityQuery.fetchNextPage()}
                loading={communityQuery.isFetchingNextPage}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
