// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { User, AuthState } from '../types';
import { useUserPreferences } from '../state/userPreferences';

type Ctx = AuthState & {
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const setPreferencesFromProfile = useUserPreferences((state) => state.setFromProfile);
  const resetPreferences = useUserPreferences((state) => state.reset);

  // Lightweight, safe cache of display-only profile fields (not tokens)
  const USER_CACHE_KEY = 'sd_user_cache_v1';

  const updateUserCache = useCallback((value: User | null) => {
    try {
      if (value) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(value));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch (error) {
      console.warn('⚠️ Unable to update user cache:', error);
    }
  }, []);

  // Hydrate UI quickly from cache so the header shows a name on refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        // Do not end loading here; this is only for initial UI hints
        if (cached && cached.id) {
          setUser((prev) => prev ?? cached);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to hydrate user cache:', error);
    }
  }, []);

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      const client = supabase;
      if (!client) {
        console.warn('⚠️ fetchUserProfile called without Supabase client');
        setUser(null);
        resetPreferences();
        updateUserCache(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await client
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error || !data) {
          if (error) {
            console.warn('⚠️ Profile fetch error (non-fatal):', error.message ?? error);
          }
          const { data: authData } = await client.auth.getUser();
          const authUser = authData?.user;
          if (authUser) {
            const fallbackUser: User = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
              spiritual_name: authUser.user_metadata?.spiritual_name,
              interests: [],
              spiritual_path: '',
              path_practices: [],
              avatar_url: authUser.user_metadata?.avatar_url ?? null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as User;
            setUser(fallbackUser);
            setPreferencesFromProfile(fallbackUser);
            updateUserCache(fallbackUser);
          } else {
            setUser(null);
            resetPreferences();
            updateUserCache(null);
          }
          return;
        }

        setUser(data as User);
        setPreferencesFromProfile(data as User);
        updateUserCache(data as User);
      } catch (error: any) {
        console.warn('⚠️ Profile fetch threw (non-fatal):', error?.message ?? error);
        const { data: authData } = await client.auth.getUser();
        const authUser = authData?.user;
        if (authUser) {
          const fallbackUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
            spiritual_name: authUser.user_metadata?.spiritual_name,
            interests: [],
            spiritual_path: '',
            path_practices: [],
            avatar_url: authUser.user_metadata?.avatar_url ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User;
          setUser(fallbackUser);
          setPreferencesFromProfile(fallbackUser);
          updateUserCache(fallbackUser);
        } else {
          setUser(null);
          resetPreferences();
          updateUserCache(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [resetPreferences, setPreferencesFromProfile, updateUserCache]
  );

  useEffect(() => {
    let alive = true;
    // Failsafe: don't keep the app in a perpetual loading state
    const timeoutId = setTimeout(() => {
      if (alive) {
        console.log('⏰ Auth init fallback timeout – ending loading state');
        setLoading(false);
      }
    }, 5000);

    // Initial session load
    (async () => {
      try {
        const client = supabase;
        if (!client) {
          console.log('❌ Supabase not configured - skipping auth initialization');
          if (alive) {
            setSession(null);
            setUser(null);
            resetPreferences();
            setLoading(false);
          }
          return;
        }

        const { data, error } = await client.auth.getSession();
        if (error) {
          console.error('❌ getSession error:', error);
        }
        const sess = data?.session ?? null;
        if (!alive) return;

        setSession(sess);

        const uid = sess?.user?.id;
        if (uid) {
          await fetchUserProfile(uid); // do not block app if this fails
        } else {
          setLoading(false);
        }
        clearTimeout(timeoutId);
      } catch (e) {
        console.error('❌ getSession thrown:', e);
        if (alive) {
          setLoading(false);
        }
        clearTimeout(timeoutId);
      }
    })();

    // Auth state listener
    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, sess) => {
        if (!alive) return;
        console.log('🔔 Auth state:', event, { hasSession: !!sess });
        setSession(sess ?? null);

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && sess?.user) {
          await fetchUserProfile(sess.user.id); // sets loading false in finally
        } else if (event === 'SIGNED_OUT' || !sess) {
          setUser(null);
          resetPreferences();
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      alive = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile, resetPreferences]);

  const signUp = async (emailRaw: string, passwordRaw: string, userData: Partial<User>) => {
    const client = supabase;
    if (!client) {
      const err = new Error('Supabase client not configured');
      console.error('❌ Signup blocked:', err.message);
      return { error: err };
    }

    const email = (emailRaw || '').trim();
    const password = passwordRaw || '';

    if (!email || !password) {
      const err = new Error('Email and password are required');
      console.error('❌ Signup validation failed:', err.message);
      return { error: err };
    }

    try {
      const { data: authData, error: authError } = await client.auth.signUp({ email, password });
      if (authError) {
        console.error('❌ Auth signup error:', authError);
        return { error: authError };
      }

      // If email confirmation is required, session may be null here
      const uid = authData.user?.id;
      if (!uid) {
        // User created; profile creation can be deferred until confirmation/sign-in
        return { error: null };
      }

      // Create profile row (non-fatal if it fails)
      const { error: profileError } = await client
        .from('users')
        .insert([{ id: uid, email, ...userData }]);

      if (profileError) {
        console.error('❌ Profile insert error:', profileError);
        // Keep session; let user retry profile completion later
        return { error: profileError };
      }

      // Update local state (best-effort)
      setUser({ id: uid, email, ...(userData as any) });
      setSession(authData.session ?? null);
      setLoading(false);

      return { error: null };
    } catch (e) {
      console.error('💥 Unexpected signup error:', e);
      return { error: e };
    }
  };

  const signIn = async (emailRaw: string, passwordRaw: string) => {
    const client = supabase;
    if (!client) {
      return { error: new Error('Supabase client not configured') };
    }
    const email = (emailRaw || '').trim();
    const password = passwordRaw || '';
    if (!email || !password) return { error: new Error('Email and password are required') };

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('❌ Signin error:', error);
      } else {
        console.log('✅ Signin ok, session=', !!data.session);
        const latestSession = data.session ?? (await client.auth.getSession()).data.session ?? null;
        setSession(latestSession);
        const uid = latestSession?.user?.id;
        if (uid) {
          await fetchUserProfile(uid);
        }
      }
      return { error };
    } catch (e) {
      console.error('💥 Unexpected signin error:', e);
      return { error: e };
    }
  };

  const signOut = async () => {
    try {
      const client = supabase;
      if (!client) {
        console.warn('⚠️ signOut called without Supabase client. Clearing local state only.');
      } else {
        const { error: localError } = await client.auth.signOut({ scope: 'local' });
        if (localError && localError.message !== 'Not logged in.') {
          console.warn('⚠️ Local signOut error:', localError.message ?? localError);
        }

        const { error: globalError } = await client.auth.signOut({ scope: 'global' });
        if (globalError && globalError.message !== 'Not logged in.') {
          console.warn('⚠️ Global signOut error:', globalError.message ?? globalError);
        }
      }
    } finally {
      setUser(null);
      setSession(null);
      setLoading(false);
      resetPreferences();
      updateUserCache(null);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) return { error: new Error('No user logged in') };
      const client = supabase;
      if (!client) {
        return { error: new Error('Supabase client not configured') };
      }
      const { error } = await client
        .from('users')
        .update(updates)
        .eq('id', user.id);
      if (error) return { error };
      const nextUser = { ...user, ...updates } as User;
      setUser(nextUser);
      setPreferencesFromProfile(nextUser);
      updateUserCache(nextUser);
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  };

  const value: Ctx = { user, session, loading, signUp, signIn, signOut, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
