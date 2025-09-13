import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '../layout/Header';
import { Welcome } from './Welcome';
import { PostFeed } from '../posts/PostFeed';
import { BookOpen, Users, Calendar, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'profile') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const hasSupabase = Boolean(supabase);

  // Quick Actions (defaults shown until DB returns)
  const [dailyReading, setDailyReading] = useState('Bhagavad Gita Chapter 4');
  const [communityStats, setCommunityStats] = useState('0 members');
  const [nextEvent, setNextEvent] = useState('No upcoming events');
  const [devotionStats, setDevotionStats] = useState('Daily practice tracker');

  const [trendingTopics, setTrendingTopics] = useState<{
    topic: string;
    count: number;
  }[]>([]);

  const [suggestedConnections, setSuggestedConnections] = useState<
    Pick<User, 'id' | 'full_name' | 'spiritual_path'>[]
  >([]);

  const fetchQuickStats = useCallback(async () => {
    if (!supabase) return;
    try {
      // Daily Reading (today or most recent past)
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data: reading } = await supabase
          .from('daily_readings')
          .select('title, reference, reading_date')
          .lte('reading_date', today)
          .order('reading_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (reading?.title) {
          setDailyReading(reading.reference ? `${reading.title} ${reading.reference}` : reading.title);
        }
      } catch {}

      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      if (typeof userCount === 'number') {
        setCommunityStats(`${userCount} members`);
      }

      const { data: event } = await supabase
        .from('events')
        .select('title')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (event?.title) {
        setNextEvent(event.title);
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  }, []);

  const fetchTrending = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('posts').select('tags');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        (p.tags || []).forEach((tag: string) => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
      const topics = Object.entries(counts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      setTrendingTopics(topics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, spiritual_path, interests')
        .neq('id', user.id)
        .limit(5);
      if (error) throw error;
      if (data) {
        const userInterests = new Set(user.interests || []);
        const sorted = data
          .map((u: any) => u)
          .sort((a: any, b: any) => {
            const aMatches = (a.interests || []).filter((i: string) =>
              userInterests.has(i)
            ).length;
            const bMatches = (b.interests || []).filter((i: string) =>
              userInterests.has(i)
            ).length;
            return bMatches - aMatches;
          })
          .slice(0, 5)
          .map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            spiritual_path: u.spiritual_path,
          }));
        setSuggestedConnections(sorted);
      }
    } catch (error) {
      console.error('Error fetching suggested connections:', error);
    }
  }, [user]);

  const fetchDevotion = useCallback(async () => {
    if (!supabase) return;
    try {
      if (!user) {
        setDevotionStats('Daily practice tracker');
        return;
      }
      const { data, error } = await supabase
        .from('practice_logs')
        .select('practiced_on')
        .eq('user_id', user.id)
        .order('practiced_on', { ascending: false })
        .limit(30);
      if (error) throw error;

      const days = (data || []).map((r: any) => r.practiced_on);
      if (!days.length) {
        setDevotionStats('No practice logged yet');
        return;
      }
      const toKey = (d: Date) => d.toISOString().slice(0, 10);
      const set = new Set(days);
      let streak = 0;
      let cur = new Date();
      if (!set.has(toKey(cur))) cur.setDate(cur.getDate() - 1);
      while (set.has(toKey(cur))) { streak += 1; cur.setDate(cur.getDate() - 1); }
      setDevotionStats(streak > 0 ? `${streak}-day streak` : 'No practice today');
    } catch (e) {
      console.error('Error fetching devotion stats:', e);
    }
  }, [user]);

  useEffect(() => {
    if (hasSupabase) {
      fetchQuickStats();
      fetchTrending();
      fetchSuggestions();
      fetchDevotion();
    }
  }, [hasSupabase, fetchQuickStats, fetchTrending, fetchSuggestions, fetchDevotion]);

  const quickActions = [
    { icon: BookOpen, label: 'Daily Reading', description: dailyReading },
    { icon: Users, label: 'Community', description: communityStats },
    { icon: Calendar, label: 'Events', description: nextEvent },
    { icon: Heart, label: 'Devotion', description: devotionStats },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onProfile={() => onNavigate('profile')} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Welcome />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <action.icon className="w-8 h-8 text-orange-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">{action.label}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              ))}
            </div>

            <PostFeed />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {trendingTopics.length === 0 && (
                  <div className="text-sm text-gray-500">No trending topics yet</div>
                )}
                {trendingTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">#{topic.topic}</span>
                    <span className="text-xs text-gray-500">
                      {topic.count} posts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Suggested Connections</h3>
              <div className="space-y-4">
                {suggestedConnections.length === 0 && (
                  <div className="text-sm text-gray-500">No suggestions yet</div>
                )}
                {suggestedConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {connection.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {connection.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {connection.spiritual_path}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
