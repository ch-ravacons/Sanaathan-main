import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface ProfilePageProps {
  onBack: () => void;
}

const toCommaSeparated = (values?: string[] | null) => (values && values.length ? values.join(', ') : '');
const toTextarea = (values?: string[] | null) => (values && values.length ? values.join('\n') : '');
const parseCommaSeparated = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const parseTextarea = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, updateProfile, signOut } = useAuth();
  const { toast } = useToast();

  const initialYears = useMemo(
    () => (user?.years_of_experience != null ? String(user.years_of_experience) : ''),
    [user?.years_of_experience]
  );

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [spiritualName, setSpiritualName] = useState(user?.spiritual_name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null);
  const [vedicQualifications, setVedicQualifications] = useState(toCommaSeparated(user?.vedic_qualifications));
  const [spiritualQualifications, setSpiritualQualifications] = useState(
    toCommaSeparated(user?.spiritual_qualifications)
  );
  const [areasOfGuidance, setAreasOfGuidance] = useState(toCommaSeparated(user?.areas_of_guidance));
  const [languagesSpoken, setLanguagesSpoken] = useState(toCommaSeparated(user?.languages_spoken));
  const [yearsOfExperience, setYearsOfExperience] = useState(initialYears);
  const [availability, setAvailability] = useState(user?.availability || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [achievements, setAchievements] = useState(toTextarea(user?.achievements));
  const [offerings, setOfferings] = useState(toTextarea(user?.offerings));
  const [certifications, setCertifications] = useState(toTextarea(user?.certifications));
  const [introduction, setIntroduction] = useState(user?.introduction || '');

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const yearsValue = yearsOfExperience.trim() ? Number(yearsOfExperience.trim()) : null;

    const { error } = await updateProfile({
      full_name: fullName,
      spiritual_name: spiritualName || null,
      location: location.trim() || null,
      bio,
      vedic_qualifications: parseCommaSeparated(vedicQualifications),
      spiritual_qualifications: parseCommaSeparated(spiritualQualifications),
      areas_of_guidance: parseCommaSeparated(areasOfGuidance),
      languages_spoken: parseCommaSeparated(languagesSpoken),
      years_of_experience: Number.isFinite(yearsValue) ? yearsValue : null,
      availability: availability.trim() || null,
      website: website.trim() || null,
      whatsapp: whatsapp.trim() || null,
      linkedin: linkedin.trim() || null,
      achievements: parseTextarea(achievements),
      offerings: parseTextarea(offerings),
      certifications: parseTextarea(certifications),
      introduction: introduction.trim() || null
    });

    setLoading(false);

    if (error) {
      toast(error.message ?? 'Failed to update profile', 'error');
    } else {
      toast('Profile updated', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="border-b border-orange-100 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mr-3 p-2" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-sand-900">My Profile</h2>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-sand-200 bg-white p-6 shadow-panel sm:p-8"
        >
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Profile photo'}
                  className="h-24 w-24 rounded-full border border-sand-200 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-2xl font-semibold text-white">
                  {(spiritualName || fullName || user?.email || 'U').charAt(0)}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-full border border-sand-200 bg-white p-1.5 shadow-sm">
                {avatarLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                ) : (
                  <Camera className="h-4 w-4 text-orange-600" />
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
            <p className="text-sm text-sand-600">
              Upload a square image (512×512 recommended) so seekers can recognise you instantly.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-sand-700">Full Name</label>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sand-700">Spiritual Name</label>
              <input
                value={spiritualName}
                onChange={(event) => setSpiritualName(event.target.value)}
                className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sand-700">Location</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, Country"
                className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-sand-700">Years of Experience</label>
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(event) => setYearsOfExperience(event.target.value)}
                className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-sand-700">Bio</label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-sand-700">Guiding Introduction</label>
              <textarea
                value={introduction}
                onChange={(event) => setIntroduction(event.target.value)}
                rows={4}
                placeholder="Share your journey, calling, and how you support seekers."
                className="w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sand-700">
                  Vedic Qualifications
                </label>
                <textarea
                  value={vedicQualifications}
                  onChange={(event) => setVedicQualifications(event.target.value)}
                  rows={3}
                  placeholder="Bhakti Shastri, Vedanta Acharya"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-sand-500">Comma-separated list.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700">
                  Spiritual Qualifications
                </label>
                <textarea
                  value={spiritualQualifications}
                  onChange={(event) => setSpiritualQualifications(event.target.value)}
                  rows={3}
                  placeholder="Initiated Guru, Pranayama Teacher"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-sand-500">Comma-separated list.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700">
                  Areas of Guidance
                </label>
                <textarea
                  value={areasOfGuidance}
                  onChange={(event) => setAreasOfGuidance(event.target.value)}
                  rows={3}
                  placeholder="Bhakti Counseling, Meditation Coaching"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-sand-500">Comma-separated list.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sand-700">
                  Languages Spoken
                </label>
                <textarea
                  value={languagesSpoken}
                  onChange={(event) => setLanguagesSpoken(event.target.value)}
                  rows={3}
                  placeholder="English, Hindi, Sanskrit"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-sand-500">Comma-separated list.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700">Availability</label>
                <input
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                  placeholder="Weekdays 6–8 PM IST"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sand-700">Website</label>
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://your-ashram.org"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-sand-700">WhatsApp</label>
                  <input
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700">LinkedIn / Public Profile</label>
                  <input
                    value={linkedin}
                    onChange={(event) => setLinkedin(event.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-sand-700">
                Achievements
                <textarea
                  value={achievements}
                  onChange={(event) => setAchievements(event.target.value)}
                  rows={4}
                  placeholder="Published Bhagavad Gita commentary\nLed 500+ satsangs"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </label>
              <p className="mt-1 text-xs text-sand-500">One per line.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sand-700">
                Offerings
                <textarea
                  value={offerings}
                  onChange={(event) => setOfferings(event.target.value)}
                  rows={4}
                  placeholder="Weekly Vedanta classes\nOne-on-one guidance"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </label>
              <p className="mt-1 text-xs text-sand-500">One per line.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sand-700">
                Certifications
                <textarea
                  value={certifications}
                  onChange={(event) => setCertifications(event.target.value)}
                  rows={4}
                  placeholder="Certified Yoga Therapist\nAuthorized Meditation Teacher"
                  className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </label>
              <p className="mt-1 text-xs text-sand-500">One per line.</p>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
