import React, { useState } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, session, loading } = useAuth();

  const handleSuccess = () => {
    // The auth context will handle navigation automatically
  };

  // If there's a session but no user profile, show profile setup
  if (session && !user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🕉️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
              <p className="text-gray-600 mb-6">
                Welcome! Please complete your spiritual profile to join our community.
              </p>
            </div>
            
            <SignUpForm onSuccess={handleSuccess} isProfileCompletion={true} />
            
            <div className="mt-6 text-center">
              <button
                onClick={async () => {
                  const { supabase } = await import('../../lib/supabase');
                  await supabase.auth.signOut();
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Sign out and use a different account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Sun className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Sanatana Dharma
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with fellow seekers on the eternal path. Share wisdom, find guidance, 
              and grow together in your spiritual journey.
            </p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12">
            <div className="flex justify-center mb-8">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    !isSignUp
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    isSignUp
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Join Community
                </button>
              </div>
            </div>

            {isSignUp ? (
              <SignUpForm onSuccess={handleSuccess} />
            ) : (
              <SignInForm onSuccess={handleSuccess} />
            )}

            <div className="mt-8 text-center text-sm text-gray-500">
              By continuing, you agree to respect our community guidelines and 
              embrace the values of dharma, ahimsa, and mutual respect.
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>
              "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः। सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत।।"
            </p>
            <p className="mt-2 italic">
              "May all beings be happy, may all beings be healthy, may all beings see goodness, may no one suffer."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};