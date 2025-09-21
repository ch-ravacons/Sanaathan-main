import { create } from 'zustand';
import type { User } from '../types';

interface UserPreferencesState {
  interests: string[];
  spiritualPath: string | null;
  pathPractices: string[];
  lastSyncedAt: string | null;
  preferencesLoaded: boolean;
  setFromProfile: (profile: Partial<User>) => void;
  setInterests: (interests: string[]) => void;
  setSpiritualPath: (spiritualPath: string | null) => void;
  setPathPractices: (practices: string[]) => void;
  reset: () => void;
  hydrateFromStorage: () => void;
}

const STORAGE_KEY = 'sd_user_preferences_state_v1';

function persist(state: Pick<UserPreferencesState, 'interests' | 'spiritualPath' | 'pathPractices' | 'lastSyncedAt'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('⚠️ Failed to persist user preferences:', error);
  }
}

export const useUserPreferences = create<UserPreferencesState>((set, get) => ({
  interests: [],
  spiritualPath: null,
  pathPractices: [],
  lastSyncedAt: null,
  preferencesLoaded: false,
  setFromProfile: (profile) => {
    const nextState = {
      interests: profile.interests ?? [],
      spiritualPath: profile.spiritual_path ?? null,
      pathPractices: profile.path_practices ?? [],
      lastSyncedAt: new Date().toISOString()
    };

    set({
      ...nextState,
      preferencesLoaded: true
    });
    persist(nextState);
  },
  setInterests: (interests) => {
    const payload = { interests, lastSyncedAt: new Date().toISOString() };
    set({
      interests,
      lastSyncedAt: payload.lastSyncedAt,
      preferencesLoaded: true
    });
    persist({
      interests,
      spiritualPath: get().spiritualPath,
      pathPractices: get().pathPractices,
      lastSyncedAt: payload.lastSyncedAt
    });
  },
  setSpiritualPath: (spiritualPath) => {
    const payload = { spiritualPath, lastSyncedAt: new Date().toISOString() };
    set({
      spiritualPath,
      lastSyncedAt: payload.lastSyncedAt,
      preferencesLoaded: true
    });
    persist({
      interests: get().interests,
      spiritualPath,
      pathPractices: get().pathPractices,
      lastSyncedAt: payload.lastSyncedAt
    });
  },
  setPathPractices: (pathPractices) => {
    const payload = { pathPractices, lastSyncedAt: new Date().toISOString() };
    set({
      pathPractices,
      lastSyncedAt: payload.lastSyncedAt,
      preferencesLoaded: true
    });
    persist({
      interests: get().interests,
      spiritualPath: get().spiritualPath,
      pathPractices,
      lastSyncedAt: payload.lastSyncedAt
    });
  },
  reset: () => {
    set({
      interests: [],
      spiritualPath: null,
      pathPractices: [],
      lastSyncedAt: null,
      preferencesLoaded: false
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('⚠️ Failed to clear user preferences:', error);
    }
  },
  hydrateFromStorage: () => {
    if (get().preferencesLoaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<Pick<UserPreferencesState, 'interests' | 'spiritualPath' | 'pathPractices' | 'lastSyncedAt'>>;
      set({
        interests: data.interests ?? [],
        spiritualPath: data.spiritualPath ?? null,
        pathPractices: data.pathPractices ?? [],
        lastSyncedAt: data.lastSyncedAt ?? null,
        preferencesLoaded: true
      });
    } catch (error) {
      console.warn('⚠️ Failed to hydrate preferences from storage:', error);
    }
  }
}));

if (typeof window !== 'undefined') {
  useUserPreferences.getState().hydrateFromStorage();
}
