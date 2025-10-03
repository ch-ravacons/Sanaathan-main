import React, { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Users,
  Calendar,
  Heart,
  Check,
  MapPin,
  CalendarClock,
  Home,
  Bot,
  Flame
} from 'lucide-react';

import { Header } from '../layout/Header';
import { Welcome } from './Welcome';
import { PostFeed } from '../posts/PostFeed';
import { DevotionTracker } from './DevotionTracker';
import { GuidancePanel } from './GuidancePanel';
import { CreateEventForm } from '../events/CreateEventForm';
import { UserProfileModal } from '../profile/UserProfileModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import {
  api,
  queryKeys,
  type SuggestedConnection,
  type TrendingTopic,
  type EventItem,
  type CommunityMember
} from '../../lib/api';
import { useUserPreferences } from '../../state/userPreferences';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'profile') => void;
}

interface MobileNavItem {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  target: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { interests, spiritualPath } = useUserPreferences();

  const preferredPath = spiritualPath ?? user?.spiritual_path ?? null;
  const primaryInterest = interests[0] ?? user?.interests?.[0] ?? null;

  const dailyReadingQuery = useQuery({
    queryKey: queryKeys.dailyReading(preferredPath),
    queryFn: () => api.getDailyReading({ path: preferredPath }),
    staleTime: 1000 * 60 * 10
  });

  const trendingQuery = useQuery({
    queryKey: queryKeys.trending('24h'),
    queryFn: () => api.getTrendingTopics({ window: '24h', limit: 5 })
  });

  const suggestionsQuery = useQuery({
    queryKey: queryKeys.suggestions(user?.id ?? null),
    queryFn: () => api.getSuggestedConnections({ userId: user?.id ?? undefined, limit: 5 }),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5
  });

  const communityQuery = useInfiniteQuery({
    queryKey: queryKeys.communityInfinite(primaryInterest),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.getCommunityMembers({
        interest: primaryInterest ?? undefined,
        cursor: pageParam ?? undefined,
        limit: 5
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  const communityMembers = useMemo(() => {
    if (!communityQuery.data?.pages) return [] as CommunityMember[];
    return communityQuery.data.pages.flatMap((page) => page.members ?? []);
  }, [communityQuery.data]);
  const communityListLoading = communityQuery.isLoading && !communityQuery.isFetchingNextPage;

  const eventFilters = useMemo(
    () => ({
      interest: primaryInterest ?? undefined,
      startAfter: undefined,
      attending: undefined,
      userId: user?.id ?? undefined
    }),
    [primaryInterest, user?.id]
  );

  const eventsQuery = useQuery({
    queryKey: queryKeys.events(eventFilters),
    queryFn: () =>
      api.listEvents({
        interest: primaryInterest ?? undefined,
        userId: user?.id ?? undefined
      })
  });

  const devotionSummaryQuery = useQuery({
    queryKey: queryKeys.devotion.summary(user?.id ?? null),
    queryFn: () => api.getDevotionSummary({ userId: user!.id }),
    enabled: Boolean(user?.id),
    retry: 0
  });

  const quickActions = useMemo(() => {
    const readingTitle = dailyReadingQuery.isLoading
      ? 'Loading daily reading…'
      : dailyReadingQuery.data?.reading?.title ?? 'Explore scripture library';

    const communityDescription = communityListLoading
      ? 'Connecting seekers…'
      : communityMembers.length
        ? `${communityMembers.length} seekers${primaryInterest ? ` • ${primaryInterest}` : ''}`
        : primaryInterest
          ? `Discover ${primaryInterest} circles`
          : 'Connect with seekers';

    const nextEvent = eventsQuery.isLoading
      ? 'Loading upcoming events…'
      : eventsQuery.data?.events?.[0]?.title ?? 'No upcoming events yet';

    const devotionSummary = !user
      ? 'Sign in to track devotion'
      : devotionSummaryQuery.isLoading
        ? 'Syncing your practice…'
        : devotionSummaryQuery.data?.summary
          ? `${devotionSummaryQuery.data.summary.total_points} pts • ${devotionSummaryQuery.data.summary.streak} day streak`
          : 'Log a practice to start your streak';

    return [
      { icon: BookOpen, label: 'Daily Reading', description: readingTitle },
      { icon: Users, label: 'Community', description: communityDescription },
      { icon: Calendar, label: 'Events', description: nextEvent },
      { icon: Heart, label: 'Devotion', description: devotionSummary }
    ];
  }, [
    dailyReadingQuery.isLoading,
    dailyReadingQuery.data?.reading?.title,
    communityQuery.isLoading,
    communityQuery.data?.members,
    primaryInterest,
    eventsQuery.isLoading,
    eventsQuery.data?.events,
    user,
    devotionSummaryQuery.isLoading,
    devotionSummaryQuery.data?.summary
  ]);

  const trendingTopics: TrendingTopic[] = trendingQuery.data?.topics ?? [];
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const suggestedConnections: SuggestedConnection[] = suggestionsQuery.data?.suggestions ?? [];
  const events: EventItem[] = eventsQuery.data?.events ?? [];
  const connectionsToShow = useMemo(
    () => suggestedConnections.filter((connection) => connection.id !== user?.id),
    [suggestedConnections, user?.id]
  );
  const devotionSummary = devotionSummaryQuery.data?.summary;
  const devotionMeter = devotionSummary?.meter ?? 0;
  const meterValue = Math.min(Math.max(devotionMeter, 0), 100);

  const followMutation = useMutation({
    mutationFn: (input: { followerId: string; followeeId: string }) => api.followUser(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.suggestions(user?.id ?? null) });
      const previous = queryClient.getQueryData<{ suggestions: SuggestedConnection[] }>(
        queryKeys.suggestions(user?.id ?? null)
      );
      if (previous) {
        queryClient.setQueryData(queryKeys.suggestions(user?.id ?? null), {
          suggestions: previous.suggestions.map((item) =>
            item.id === variables.followeeId ? { ...item, is_following: true } : item
          )
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.suggestions(user?.id ?? null), context.previous);
      }
      toast('Unable to follow right now. Please try again later.', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions(user?.id ?? null) });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: (input: { followerId: string; followeeId: string }) => api.unfollowUser(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.suggestions(user?.id ?? null) });
      const previous = queryClient.getQueryData<{ suggestions: SuggestedConnection[] }>(
        queryKeys.suggestions(user?.id ?? null)
      );
      if (previous) {
        queryClient.setQueryData(queryKeys.suggestions(user?.id ?? null), {
          suggestions: previous.suggestions.map((item) =>
            item.id === variables.followeeId ? { ...item, is_following: false } : item
          )
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.suggestions(user?.id ?? null), context.previous);
      }
      toast('Unable to update follow status.', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions(user?.id ?? null) });
    }
  });

  const rsvpMutation = useMutation({
    mutationFn: (input: { eventId: string; status: 'going' | 'interested' | 'not_going' }) => {
      if (!user?.id) {
        return Promise.reject(new Error('Sign in required'));
      }
      return api.rsvpEvent({ eventId: input.eventId, status: input.status, userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events(eventFilters) });
      toast('Event RSVP updated', 'success');
    },
    onError: () => toast('Unable to update RSVP. Try again later.', 'error')
  });

  const markReadingMutation = useMutation({
    mutationFn: () => {
      if (!user?.id || !dailyReadingQuery.data?.reading?.id) {
        return Promise.reject(new Error('Missing user or reading'));
      }
      return api.markReadingComplete({ readingId: dailyReadingQuery.data.reading.id, userId: user.id });
    },
    onSuccess: () => {
      toast('Reading marked as complete 🙏', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyReading(preferredPath) });
    },
    onError: () => toast('Unable to mark reading complete right now.', 'error')
  });

  const handleToggleFollow = (connection: SuggestedConnection) => {
    if (!user?.id) {
      toast('Sign in to manage followers', 'info');
      return;
    }

    if (connection.is_following) {
      unfollowMutation.mutate({ followerId: user.id, followeeId: connection.id });
    } else {
      followMutation.mutate({ followerId: user.id, followeeId: connection.id });
    }
  };

  const handleRsvp = (eventId: string, status: 'going' | 'interested') => {
    if (!user?.id) {
      toast('Sign in to RSVP to events', 'info');
      return;
    }
    rsvpMutation.mutate({ eventId, status });
  };

  const handleMarkReadingComplete = () => {
    if (!user?.id) {
      toast('Sign in to track your readings', 'info');
      return;
    }
    markReadingMutation.mutate();
  };

  const handleTrendingSelect = (topic: string) => {
    setSelectedTopic((prev) => (prev === topic ? null : topic));
  };

  const handleDownloadIcs = async (eventId: string, title: string) => {
    try {
      const ics = await api.downloadEventIcs(eventId);
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${title.replace(/\s+/g, '-').toLowerCase()}.ics`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast('Calendar file downloaded', 'success');
    } catch (error: any) {
      toast(error?.message ?? 'Unable to download ICS file right now.', 'error');
    }
  };

  const handleViewProfile = (id: string) => {
    setProfileModalUserId(id);
  };

  const mobileNavItems: MobileNavItem[] = useMemo(
    () => [
      { label: 'Feed', icon: Home, target: 'dashboard-feed' },
      { label: 'Guidance', icon: Bot, target: 'dashboard-guidance' },
      { label: 'Events', icon: CalendarClock, target: 'dashboard-events' },
      { label: 'Tracker', icon: Flame, target: 'dashboard-tracker' }
    ],
    []
  );

  return (
    <div className="min-h-screen bg-sand-50 pb-24 lg:pb-10">
      <Header onProfile={() => onNavigate('profile')} />

      <main className="max-w-7xl mx-auto px-4 pt-8 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[280px_minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <section className="order-2 flex flex-col gap-6 lg:order-1">
            <Card variant="subtle" padding="md" className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Today</p>
                <h3 className="text-xl font-semibold text-sand-900">Quick Highlights</h3>
                <p className="text-sm text-sand-600">Stay aligned with your practice at a glance.</p>
              </div>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <div
                    key={action.label}
                    className="flex items-center gap-3 rounded-2xl border border-sand-100 bg-white/80 px-3 py-3 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-sand-900">{action.label}</p>
                      <p className="text-xs leading-relaxed text-sand-600 line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              padding="md"
              className="space-y-4 bg-gradient-to-br from-brand-25 via-white to-white"
              id="dashboard-connections"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-sand-900">Suggested Connections</h3>
                  <p className="text-sm text-sand-600">Build meaningful bonds with fellow seekers.</p>
                </div>
                <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-brand-100 px-2 text-xs font-semibold text-brand-600">
                  {connectionsToShow.length}
                </span>
              </div>
              <div className="space-y-4">
                {suggestionsQuery.isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl border border-sand-100 bg-sand-25 p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 animate-pulse rounded-full bg-sand-100" />
                          <div className="space-y-2">
                            <div className="h-3 w-24 rounded bg-sand-100" />
                            <div className="h-3 w-16 rounded bg-sand-100" />
                          </div>
                        </div>
                        <div className="h-8 w-20 rounded-full bg-sand-100" />
                      </div>
                    ))}
                  </div>
                )}

                {!suggestionsQuery.isLoading && !user && (
                  <p className="text-sm text-sand-600">Sign in to receive personalized suggestions.</p>
                )}

                {suggestionsQuery.isError && (
                  <p className="text-sm text-brand-600">Unable to load suggestions right now.</p>
                )}

                {!suggestionsQuery.isLoading && user && connectionsToShow.length === 0 && !suggestionsQuery.isError && (
                  <p className="text-sm text-sand-600">No suggestions yet. Check back soon!</p>
                )}

                {connectionsToShow.map((connection) => {
                  const isFollowPending =
                    (followMutation.isPending && followMutation.variables?.followeeId === connection.id) ||
                    (unfollowMutation.isPending && unfollowMutation.variables?.followeeId === connection.id);
                  const sharedInterest = connection.shared_interests?.[0];
                  const displayName = connection.full_name || connection.spiritual_path || 'Spiritual seeker';

                  const renderFollowButton = (extraClassName?: string) => (
                    <Button
                      type="button"
                      size="sm"
                      variant={connection.is_following ? 'ghost' : 'outline'}
                      className={`min-w-[84px] justify-center focus-visible:ring-offset-0 ${extraClassName ?? ''}`}
                      loading={isFollowPending}
                      onClick={() => handleToggleFollow(connection)}
                    >
                      {connection.is_following ? 'Following' : 'Follow'}
                    </Button>
                  );

                  return (
                    <div key={connection.id} className="group relative">
                      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border border-brand-100 bg-white/80 px-3 py-3 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold uppercase text-white">
                          {displayName.charAt(0)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-sand-900">{displayName}</p>
                          <p className="truncate text-xs text-sand-500">{connection.spiritual_path ?? 'Seeker'}</p>
                          {connection.years_of_experience != null && (
                            <p className="text-xs text-sand-500">
                              {connection.years_of_experience} years guiding
                            </p>
                          )}
                          {connection.areas_of_guidance && connection.areas_of_guidance.length > 0 && (
                            <p className="truncate text-xs text-sand-500">
                              Focus • {connection.areas_of_guidance.slice(0, 2).join(', ')}
                              {connection.areas_of_guidance.length > 2 ? '…' : ''}
                            </p>
                          )}
                          {sharedInterest && (
                            <div className="flex flex-wrap gap-1">
                              <Badge tone="neutral" size="sm">#{sharedInterest}</Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {renderFollowButton()}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-xs text-sand-500 hover:text-brand-600"
                            onClick={() => handleViewProfile(connection.id)}
                          >
                            View profile
                          </Button>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute left-1/2 bottom-full z-20 hidden w-64 -translate-x-1/2 -translate-y-3 opacity-0 transition-all duration-200 group-hover:flex group-hover:-translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto">
                        <div className="w-full rounded-2xl border border-brand-100 bg-white p-4 text-left shadow-panel">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold uppercase text-white">
                              {displayName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-sand-900">{displayName}</p>
                              <p className="text-xs text-sand-500">{connection.spiritual_path ?? 'Seeker'}</p>
                              {sharedInterest && <p className="text-xs text-sand-500">Shared interest: #{sharedInterest}</p>}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="pointer-events-auto text-xs text-sand-500 hover:text-brand-600"
                              onClick={() => handleViewProfile(connection.id)}
                            >
                              View profile
                            </Button>
                            <div className="pointer-events-auto">{renderFollowButton('pointer-events-auto')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card padding="md" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-sand-900">Community Members</h3>
                <p className="text-sm text-sand-600">Explore seekers aligned with your interests.</p>
              </div>
              <div className="space-y-3">
                {communityListLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-12 animate-pulse rounded-xl bg-sand-100" />
                    ))}
                  </div>
                )}

                {!communityListLoading && communityMembers.length === 0 && (
                  <p className="text-sm text-sand-600">No members found for this interest yet.</p>
                )}

                {communityMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-sand-100 bg-white/75 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-sand-900">{member.full_name}</p>
                      <p className="truncate text-xs text-sand-600">{member.spiritual_path ?? 'Seeker'}</p>
                      {member.areas_of_guidance && member.areas_of_guidance.length > 0 && (
                        <p className="truncate text-xs text-sand-500">
                          Focus • {member.areas_of_guidance.slice(0, 2).join(', ')}
                          {member.areas_of_guidance.length > 2 ? '…' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {member.location && <span className="text-xs text-sand-500">{member.location}</span>}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="px-2 py-1 text-xs text-sand-500 hover:text-brand-600"
                        onClick={() => handleViewProfile(member.id)}
                      >
                        View profile
                      </Button>
                    </div>
                  </div>
                ))}

                {communityQuery.isFetchingNextPage && (
                  <div className="h-10 animate-pulse rounded-xl bg-sand-100" />
                )}

                {communityQuery.hasNextPage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => communityQuery.fetchNextPage()}
                    disabled={communityQuery.isFetchingNextPage}
                  >
                    {communityQuery.isFetchingNextPage ? 'Loading…' : 'Show more seekers'}
                  </Button>
                )}
              </div>
            </Card>

            <Card padding="md" className="space-y-4" id="dashboard-events">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-sand-900">Upcoming Events</h3>
                    <p className="text-sm text-sand-600">Stay connected with spiritual gatherings.</p>
                  </div>
                  {user && (
                    <Button
                      type="button"
                      size="sm"
                      variant={showCreateEvent ? 'ghost' : 'outline'}
                      onClick={() => setShowCreateEvent((prev) => !prev)}
                    >
                      {showCreateEvent ? 'Close' : 'Create Event'}
                    </Button>
                  )}
                </div>
              </div>
              {showCreateEvent && user && (
                <div className="rounded-2xl border border-sand-200 bg-sand-50/80 p-4">
                  <CreateEventForm interestFilter={primaryInterest} />
                </div>
              )}
              <div className="space-y-4">
                {eventsQuery.isLoading && (
                  <div className="space-y-3">
                    {[1, 2].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-xl bg-sand-100" />
                    ))}
                  </div>
                )}

                {!eventsQuery.isLoading && events.length === 0 && (
                  <p className="text-sm text-sand-600">No events scheduled. Create one to uplift the community!</p>
                )}

                {events.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-sand-100 bg-white/85 px-3 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-sand-900">{event.title}</p>
                        {event.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-sand-600">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </p>
                        )}
                        <p className="text-xs text-sand-500">Attending: {event.attendees_count}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={event.is_attending ? 'primary' : 'outline'}
                          loading={rsvpMutation.isPending}
                          onClick={() => handleRsvp(event.id, 'going')}
                        >
                          Going
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={rsvpMutation.isPending}
                          onClick={() => handleRsvp(event.id, 'interested')}
                        >
                          Interested
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={rsvpMutation.isPending}
                          onClick={() => handleRsvp(event.id, 'not_going')}
                        >
                          Not Going
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadIcs(event.id, event.title)}
                        >
                          Add to Calendar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="order-1 min-w-0 flex flex-col gap-6">
            <Welcome />

            <section id="dashboard-feed">
              <PostFeed topicFilter={selectedTopic} onTopicFilterClear={() => setSelectedTopic(null)} />
            </section>
          </section>

          <section className="order-3 flex flex-col gap-6 lg:order-3">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              {user && devotionSummary && (
                <Card variant="accent" padding="md" className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Spiritual Meter</p>
                      <h3 className="text-xl font-semibold text-sand-900">Your current energy</h3>
                    </div>
                    <Badge tone="brand" size="sm">{meterValue}%</Badge>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 transition-all duration-500"
                      style={{ width: `${meterValue}%` }}
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm text-sand-700">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Total points</dt>
                      <dd className="text-lg font-semibold text-sand-900">{devotionSummary.total_points}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Streak</dt>
                      <dd className="text-lg font-semibold text-sand-900">{devotionSummary.streak} days</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Level</dt>
                      <dd className="text-lg font-semibold text-sand-900">{devotionSummary.level}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sand-500">Next milestone</dt>
                      <dd className="text-lg font-semibold text-sand-900">{Math.max(0, 100 - meterValue)}% left</dd>
                    </div>
                  </dl>
                </Card>
              )}

              {dailyReadingQuery.data?.reading && (
                <Card padding="md" className="space-y-4 lg:shadow-panel">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-sand-900">Daily Reading</h3>
                      <p className="text-sm font-medium text-sand-700">{dailyReadingQuery.data.reading.title}</p>
                      {dailyReadingQuery.data.reading.summary && (
                        <p className="mt-2 text-sm leading-relaxed text-sand-600">
                          {dailyReadingQuery.data.reading.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="soft-divider" />
                  <div className="flex items-center justify-between text-xs text-sand-500">
                    <span>Path: {dailyReadingQuery.data.reading.path.toUpperCase()}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={markReadingMutation.isPending}
                      onClick={handleMarkReadingComplete}
                    >
                      <Check className="h-4 w-4" /> Mark complete
                    </Button>
                  </div>
                </Card>
              )}

              <section id="dashboard-tracker">
                <DevotionTracker />
              </section>

              <Card padding="md" className="space-y-4" id="dashboard-trending">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-sand-900">Trending Topics</h3>
                  {selectedTopic && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
                      Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {trendingQuery.isLoading && (
                    <div className="space-y-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-4 w-full animate-pulse rounded bg-sand-100" />
                      ))}
                    </div>
                  )}

                  {!trendingQuery.isLoading && trendingTopics.length === 0 && (
                    <p className="text-sm text-sand-600">No trending topics yet</p>
                  )}

                  {trendingTopics.map((topic) => {
                    const isActive = selectedTopic === topic.topic;
                    return (
                      <button
                        type="button"
                        key={topic.topic}
                        onClick={() => handleTrendingSelect(topic.topic)}
                        className={`w-full rounded-full border px-4 py-2 text-sm transition ${
                          isActive
                            ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-soft'
                            : 'border-transparent bg-sand-100/60 text-sand-700 hover:bg-sand-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">#{topic.topic}</span>
                          <span className="text-xs text-sand-500">{topic.post_count} posts</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <section id="dashboard-guidance">
                <GuidancePanel />
              </section>
            </div>
          </section>
        </div>
      </main>

      <MobileBottomNav items={mobileNavItems} />
      {profileModalUserId && (
        <UserProfileModal userId={profileModalUserId} onClose={() => setProfileModalUserId(null)} />
      )}
    </div>
  );
};

const MobileBottomNav: React.FC<{ items: MobileNavItem[] }> = ({ items }) => (
  <nav className="fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 lg:hidden">
    <div className="flex items-center justify-between rounded-full border border-sand-100/70 bg-sand-25/95 px-4 py-3 text-sand-600 shadow-soft backdrop-blur">
      {items.map((item) => (
        <a
          key={item.target}
          href={`#${item.target}`}
          className="flex flex-col items-center gap-1 text-xs font-medium transition hover:text-brand-600"
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </a>
      ))}
    </div>
  </nav>
);
