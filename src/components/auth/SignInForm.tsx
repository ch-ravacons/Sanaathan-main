import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface SignInFormProps {
  onSuccess?: () => void; // optional usage; router guard is fine too
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const em = (email || '').trim();
    const pw = password || '';
    if (!em || !pw) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const { error } = await signIn(em, pw);
    if (error) {
      setError(error.message || 'Sign-in failed');
      setLoading(false);
      return;
    }

    // Success: stop spinner. Your route guard/App should now switch to dashboard.
    setLoading(false);
    onSuccess?.();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to continue your spiritual journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your.email@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>
    </div>
  );
};
