import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { interests } from '../../data/interests';
import { spiritualPaths } from '../../data/spiritualPaths';

export const Welcome: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const userInterests = user.interests?.map(id => 
    interests.find(interest => interest.id === id)?.name
  ).filter(Boolean) || [];

  const userPath = spiritualPaths.find(path => path.id === user.spiritual_path);

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8 border border-orange-100">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Om Namaste, {user.spiritual_name || user.full_name}! 🙏
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to your spiritual community. May your journey be filled with wisdom and peace.
          </p>
          
          {userPath && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-orange-700 mb-1">Your Spiritual Path</h3>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm">
                {userPath.name}
              </div>
            </div>
          )}

          {userInterests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-700 mb-2">Your Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userInterests.slice(0, 6).map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-1 bg-white bg-opacity-70 text-gray-700 text-xs rounded-md border border-orange-200"
                  >
                    {interest}
                  </span>
                ))}
                {userInterests.length > 6 && (
                  <span className="px-2 py-1 bg-white bg-opacity-70 text-gray-500 text-xs rounded-md border border-orange-200">
                    +{userInterests.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {(user.spiritual_name || user.full_name).charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
};