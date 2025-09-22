import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, Calendar, Heart, Check, UserPlus, MapPin, CalendarClock } from 'lucide-react';

import { Header } from '../layout/Header';
import { Welcome } from './Welcome';
import { PostFeed } from '../posts/PostFeed';
import { DevotionTracker } from './DevotionTracker';
import { GuidancePanel } from './GuidancePanel';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { api, queryKeys, type SuggestedConnection, type TrendingTopic, type EventItem } from '../../lib/api';
import { useUserPreferences } from '../../state/userPreferences';

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'profile') => void;
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

  const communityQuery = useQuery({
    queryKey: queryKeys.community(primaryInterest),
    queryFn: () => api.getCommunityMembers({ interest: primaryInterest ?? undefined, limit: 5 })
  });

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

    const communityDescription = communityQuery.isLoading
      ? 'Connecting seekers…'
      : communityQuery.data?.members?.length
        ? `${communityQuery.data.members.length} seekers${primaryInterest ? ` • ${primaryInterest}` : ''}`
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
  const suggestedConnections: SuggestedConnection[] = suggestionsQuery.data?.suggestions ?? [];
  const events: EventItem[] = eventsQuery.data?.events ?? [];
  const connectionsToShow = useMemo(
    () => suggestedConnections.filter((connection) => connection.id !== user?.id),
    [suggestedConnections, user?.id]
  );
  const devotionSummary = devotionSummaryQuery.data?.summary;
  const devotionMeter = devotionSummary?.meter ?? 0;

  const followMutation = useMutation({
    mutationFn: (input: { followerId: string; followeeId: string }) => api.followUser(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.suggestions(user?.id ?? null) });
      const previous = queryClient.getQueryData<{ suggestions: SuggestedConnection[] }>(queryKeys.suggestions(user?.id ?? null));
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
      const previous = queryClient.getQueryData<{ suggestions: SuggestedConnection[] }>(queryKeys.suggestions(user?.id ?? null));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onProfile={() => onNavigate('profile')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Welcome />

        {user && devotionSummary && (
          <div className="mb-6 bg-white border border-orange-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-orange-700">Spiritual Meter</span>
              <span className="text-xs font-medium text-orange-600">{devotionMeter}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-orange-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${Math.min(Math.max(devotionMeter, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <action.icon className="w-8 h-8 text-orange-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">{action.label}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">{action.description}</p>
                </div>
              ))}
            </div>

            <PostFeed topicFilter={selectedTopic} onTopicFilterClear={() => setSelectedTopic(null)} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {dailyReadingQuery.data?.reading && (
              <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-orange-600" /> Daily Reading
                    </h3>
                    <p className="text-sm font-medium text-gray-800">{dailyReadingQuery.data.reading.title}</p>
                    {dailyReadingQuery.data.reading.summary && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-4">
                        {dailyReadingQuery.data.reading.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Path: {dailyReadingQuery.data.reading.path.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={handleMarkReadingComplete}
                    disabled={markReadingMutation.isPending}
                    className="inline-flex items-center gap-2 text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    <Check className="w-4 h-4" />
                    {markReadingMutation.isPending ? 'Saving…' : 'Mark as complete'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {trendingQuery.isLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-4 bg-gray-100 animate-pulse rounded" />
                    ))}
                  </div>
                )}
                {!trendingQuery.isLoading && trendingTopics.length === 0 && (
                  <div className="text-sm text-gray-500">No trending topics yet</div>
                )}
                {trendingTopics.map((topic) => {
                  const isActive = selectedTopic === topic.topic;
                  return (
                    <button
                      type="button"
                      key={topic.topic}
                      onClick={() => handleTrendingSelect(topic.topic)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded ${
                        isActive ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-sm">#{topic.topic}</span>
                      <span className="text-xs text-gray-500">{topic.post_count} posts</span>
                    </button>
                  );
                })}
                {selectedTopic && (
                  <button
                    type="button"
                    onClick={() => setSelectedTopic(null)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Suggested Connections</h3>
              <div className="space-y-4">
                {suggestionsQuery.isLoading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                          <div className="space-y-2">
                            <div className="w-24 h-3 bg-gray-100 rounded" />
                            <div className="w-16 h-3 bg-gray-100 rounded" />
                          </div>
                        </div>
                        <div className="w-16 h-6 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                )}
                {!suggestionsQuery.isLoading && !user && (
                  <div className="text-sm text-gray-500">Sign in to receive personalized suggestions.</div>
                )}
                {suggestionsQuery.isError && (
                  <div className="text-sm text-red-500">Unable to load suggestions right now.</div>
                )}
                {!suggestionsQuery.isLoading && user && connectionsToShow.length === 0 && !suggestionsQuery.isError && (
                  <div className="text-sm text-gray-500">No suggestions yet</div>
                )}
                {connectionsToShow.map((connection) => {
                  const isFollowPending =
                    (followMutation.isPending && followMutation.variables?.followeeId === connection.id) ||
                    (unfollowMutation.isPending && unfollowMutation.variables?.followeeId === connection.id);
                  return (
                    <div key={connection.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {connection.full_name?.charAt(0) ?? 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{connection.full_name}</p>
                          <p className="text-xs text-gray-500">{connection.spiritual_path ?? 'Spiritual seeker'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(connection)}
                        disabled={isFollowPending}
                        className={`text-xs font-medium flex items-center gap-2 ${
                          connection.is_following ? 'text-gray-500 hover:text-gray-600' : 'text-orange-600 hover:text-orange-700'
                        }`}
                      >
                        {connection.is_following ? (
                          <>
                            <Check className="w-3 h-3" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" /> Follow
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-orange-600" /> Upcoming Events
              </h3>
              <div className="space-y-4">
                {eventsQuery.isLoading && (
                  <div className="space-y-3">
                    {[1, 2].map((item) => (
                      <div key={item} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                )}
                {!eventsQuery.isLoading && events.length === 0 && (
                  <p className="text-sm text-gray-500">No events scheduled. Create one to uplift the community!</p>
                )}
                {events.slice(0, 4).map((event) => (
                  <div key={event.id} className="border border-gray-100 rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        {event.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Attending: {event.attendees_count}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRsvp(event.id, 'going')}
                          disabled={rsvpMutation.isPending}
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            event.is_attending
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          }`}
                        >
                          Going
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRsvp(event.id, 'interested')}
                          disabled={rsvpMutation.isPending}
                          className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:border-gray-300"
                        >
                          Interested
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Community Members</h3>
              <div className="space-y-3">
                {communityQuery.isLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-12 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                )}
                {!communityQuery.isLoading && communityQuery.data?.members?.length === 0 && (
                  <p className="text-sm text-gray-500">No members found for this interest yet.</p>
                )}
                {communityQuery.data?.members?.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                      <p className="text-xs text-gray-500">{member.spiritual_path ?? 'Seeker'}</p>
                    </div>
                    {member.location && <span className="text-xs text-gray-400">{member.location}</span>}
                  </div>
                ))}
              </div>
            </div>

            <DevotionTracker />

            <GuidancePanel />
          </div>
        </div>
      </main>
    </div>
  );
};
