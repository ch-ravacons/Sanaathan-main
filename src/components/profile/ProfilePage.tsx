import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, updateProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [spiritualName, setSpiritualName] = useState(user?.spiritual_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleAvatarUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) return;
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file for your profile photo.', 'warning');
        return;
      }

      setAvatarLoading(true);
      try {
        const uploadInfo = await api.getAvatarUploadUrl({ userId: user.id, fileName: file.name });

        const response = await fetch(uploadInfo.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            ...(uploadInfo.headers ?? {})
          },
          body: file
        });

        if (!response.ok) {
          throw new Error('Failed to upload avatar');
        }

        const publicUrl = uploadInfo.publicUrl ?? uploadInfo.uploadUrl;
        await api.updateUserAvatar({ userId: user.id, avatarUrl: publicUrl });
        setAvatarUrl(publicUrl);
        await updateProfile({ avatar_url: publicUrl });
        toast('Profile photo updated!', 'success');
      } catch (error: any) {
        console.error(error);
        toast(error?.message ?? 'Unable to update profile photo', 'error');
      } finally {
        setAvatarLoading(false);
        event.target.value = '';
      }
    },
    [toast, updateProfile, user]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await updateProfile({
      full_name: fullName,
      spiritual_name: spiritualName,
      bio,
    });
    setLoading(false);
    if (error) {
      alert('Failed to update profile');
    } else {
      alert('Profile updated');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Button variant="ghost" className="p-2 mr-2" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">My Profile</h2>
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Profile photo'}
                  className="w-20 h-20 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-semibold">
                  {(spiritualName || fullName || user?.email || 'U').charAt(0)}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow cursor-pointer">
                {avatarLoading ? (
                  <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-orange-600" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarLoading}
                />
              </label>
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-800">Profile Photo</p>
              <p>Upload a square image (recommended 512x512) to personalize your presence.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spiritual Name</label>
            <input
              type="text"
              value={spiritualName}
              onChange={(e) => setSpiritualName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
            <Button type="submit" loading={loading}>
              Save
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
