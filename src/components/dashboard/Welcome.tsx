import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { interests } from '../../data/interests';
import { spiritualPaths } from '../../data/spiritualPaths';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const Welcome: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const userInterests = user.interests?.map(id => 
    interests.find(interest => interest.id === id)?.name
  ).filter(Boolean) || [];

  const userPath = spiritualPaths.find(path => path.id === user.spiritual_path);

  return (
    <Card variant="accent" padding="lg" className="overflow-hidden">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Welcome back</p>
            <h2 className="text-2xl font-display text-sand-900 sm:text-3xl">
              Namaskaram, {user.spiritual_name || user.full_name}! 🙏
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-sand-600">
            May your journey today be filled with wisdom, kindness, and conscious devotion. Here's what the community has prepared for you.
          </p>

          {userPath && (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-500">Your spiritual path</h3>
              <Badge tone="brand">{userPath.name}</Badge>
            </div>
          )}

          {userInterests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-500">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userInterests.slice(0, 6).map((interest) => (
                  <Badge key={interest} tone="neutral" size="sm">
                    {interest}
                  </Badge>
                ))}
                {userInterests.length > 6 && (
                  <Badge tone="neutral" size="sm">+{userInterests.length - 6} more</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-2xl font-semibold text-white shadow-panel">
            <div className="flex h-full w-full items-center justify-center">
              {(user.spiritual_name || user.full_name).charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
