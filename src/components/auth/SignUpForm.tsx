import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { interests } from '../../data/interests';
import { spiritualPaths } from '../../data/spiritualPaths';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onSuccess: () => void;
  isProfileCompletion?: boolean;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, isProfileCompletion = false }) => {
  const { signUp, updateProfile, user: currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Basic Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [spiritualName, setSpiritualName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState('');

  // Interests & Paths
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  const handleInterestChange = (interestId: string, checked: boolean) => {
    setSelectedInterests((prev) =>
      checked ? [...prev, interestId] : prev.filter((id) => id !== interestId)
    );
  };

  const handlePracticeChange = (practice: string, checked: boolean) => {
    setSelectedPractices((prev) =>
      checked ? [...prev, practice] : prev.filter((p) => p !== practice)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Step 1 validation
    if (step === 1) {
      if (!isProfileCompletion) {
        const em = (email || '').trim();
        if (!em) { setError('Email is required'); return; }
        if (!password) { setError('Password is required'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      }
      setStep(2);
      return;
    }

    // Step 2 – submit
    setLoading(true);
    try {
      const userData = {
        full_name: fullName,
        spiritual_name: spiritualName || null,
        phone: phone || null,
        location: location || null,
        age_group: ageGroup || null,
        gender: gender || null,
        interests: selectedInterests,       // ensure column type matches (text[] or jsonb)
        spiritual_path: selectedPath,
        path_practices: selectedPractices,  // ensure column type matches (text[] or jsonb)
        bio: bio || null,
      };

      let resultError: any = null;

      if (isProfileCompletion && currentUser) {
        const result = await updateProfile(userData);
        resultError = result.error;
      } else {
       // Additional validation for regular signup
       if (!isProfileCompletion) {
         const em = (email || '').trim();
         if (!em) { setError('Email is required'); setLoading(false); return; }
         if (!password) { setError('Password is required'); setLoading(false); return; }
       }

        const result = await signUp((email || '').trim(), password, userData);
        resultError = result.error;
      }

      if (resultError) {
        const msg =
          resultError?.code === 'user_already_exists' ||
          resultError?.message?.includes('User already registered')
            ? `An account with email "${email}" already exists. Please sign in instead or use a different email.`
            : resultError?.message || 'An error occurred during signup';
        setError(msg);
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedPathData = spiritualPaths.find((p) => p.id === selectedPath);
  const groupedInterests = interests.reduce((acc, interest) => {
    (acc[interest.category] ||= []).push(interest);
    return acc;
  }, {} as Record<string, typeof interests>);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Join Our Sacred Community</h2>
          <div className="text-sm text-gray-500">Step {step} of 2</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your legal name"
              />
              <Input
                label="Spiritual Name (Optional)"
                type="text"
                value={spiritualName}
                onChange={(e) => setSpiritualName(e.target.value)}
                placeholder="Your spiritual or initiated name"
              />
            </div>

            {!isProfileCompletion && (
              <>
                <Input
                  label="Email Address *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Password *"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                  />
                  <Input
                    label="Confirm Password *"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Phone (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <Select
                label="Age Group (Optional)"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
              >
                <option value="">Select age group</option>
                <option value="18-25">18-25</option>
                <option value="26-35">26-35</option>
                <option value="36-45">36-45</option>
                <option value="46-55">46-55</option>
                <option value="56-65">56-65</option>
                <option value="65+">65+</option>
              </Select>
              <Select
                label="Gender (Optional)"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <Input
              label="Location (Optional)"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State/Country"
            />

            <Button type="submit" className="w-full" size="lg">
              {isProfileCompletion ? 'Continue to Spiritual Interests' : 'Continue to Spiritual Interests'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* Spiritual Path Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Spiritual Path</h3>
              <div className="space-y-3">
                {spiritualPaths.map((path) => (
                  <div
                    key={path.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPath === path.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPath(path.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="spiritual-path"
                        value={path.id}
                        checked={selectedPath === path.id}
                        onChange={() => setSelectedPath(path.id)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{path.name}</h4>
                        <p className="text-sm text-gray-600">{path.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Path Practices */}
            {selectedPathData && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Your Practices within {selectedPathData.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPathData.practices.map((practice) => (
                    <Checkbox
                      key={practice}
                      label={practice}
                      checked={selectedPractices.includes(practice)}
                      onChange={(checked) => handlePracticeChange(practice, checked)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Interest</h3>
              {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3 capitalize">
                    {category === 'scripture' ? 'Sacred Texts' :
                     category === 'practice' ? 'Spiritual Practices' :
                     category === 'philosophy' ? 'Philosophy & Doctrine' :
                     'Rituals & Culture'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryInterests.map((interest) => (
                      <Checkbox
                        key={interest.id}
                        label={interest.name}
                        description={interest.description}
                        checked={selectedInterests.includes(interest.id)}
                        onChange={(checked) => handleInterestChange(interest.id, checked)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tell us about your spiritual journey..."
              />
            </div>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" loading={loading} className="flex-1" size="lg">
                {isProfileCompletion ? 'Complete Profile' : 'Create Account'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
