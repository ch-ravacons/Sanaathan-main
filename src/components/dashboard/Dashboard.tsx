import React from 'react';
import { Header } from '../layout/Header';
import { Welcome } from './Welcome';
import { PostFeed } from '../posts/PostFeed';
import { BookOpen, Users, Calendar, Heart } from 'lucide-react';

export const Dashboard: React.FC = () => {

  const quickActions = [
    { icon: BookOpen, label: 'Daily Reading', description: 'Bhagavad Gita Chapter 4' },
    { icon: Users, label: 'Community', description: '1.2k active members' },
    { icon: Calendar, label: 'Events', description: 'Upcoming satsang' },
    { icon: Heart, label: 'Devotion', description: 'Daily practice tracker' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">#BhagavadGita</span>
                  <span className="text-xs text-gray-500">2.1k posts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">#Meditation</span>
                  <span className="text-xs text-gray-500">1.8k posts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">#Yoga</span>
                  <span className="text-xs text-gray-500">1.5k posts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">#Diwali2024</span>
                  <span className="text-xs text-gray-500">1.2k posts</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Suggested Connections</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      R
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ravi Shankar</p>
                      <p className="text-xs text-gray-500">Yoga Teacher</p>
                    </div>
                  </div>
                  <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                    Follow
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sita Devi</p>
                      <p className="text-xs text-gray-500">Sanskrit Scholar</p>
                    </div>
                  </div>
                  <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                    Follow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};