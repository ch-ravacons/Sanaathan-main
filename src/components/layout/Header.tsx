import React, { useCallback } from 'react';
import { Sun, Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface HeaderProps {
  onProfile?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfile, onSignOut }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      onSignOut?.();
      toast('Signed out successfully', 'info');
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    } catch (error: any) {
      console.error('Failed to sign out', error);
      toast(error?.message ?? 'Unable to sign out right now.', 'error');
    }
  }, [signOut, onSignOut, toast]);

  return (
    <header className="bg-white shadow-md border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Sanatana One
            </h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts, people, topics..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="p-2">
              <Bell className="w-5 h-5" />
            </Button>
            
            <button
              onClick={onProfile}
              className="flex items-center space-x-3 focus:outline-none"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name ?? 'Profile'}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.spiritual_name || user?.full_name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.spiritual_path || 'Spiritual Seeker'}
                </p>
              </div>
            </button>

            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="p-2"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
