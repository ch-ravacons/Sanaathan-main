import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user, session, loading } = useAuth();

  console.log(
    '🏠 App state - user:',
    !!user,
    'session:',
    !!session,
    'loading:',
    loading,
    'timestamp:',
    new Date().toISOString()
  );

  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🕉️</span>
          </div>
          <p className="text-gray-600">
            Connecting to the spiritual community...
          </p>
        </div>
      </div>
    );
  }

  console.log(
    '🎨 Rendering:',
    session ? 'Dashboard' : 'AuthPage',
    'timestamp:',
    new Date().toISOString()
  );
  return session ? <Dashboard /> : <AuthPage />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
