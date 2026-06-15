import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode, Language, User, HealthProfile } from '../types';

// Lazy-load AsyncStorage so web + tests don't break if native module is absent
const getStorage = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage');
    return AS.default ?? AS;
  } catch {
    // Fallback to localStorage on web / test env
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }
};

interface AppStore {
  theme: ThemeMode;
  language: Language;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;

  user: User | null;
  setUser: (user: User | null) => void;

  healthProfile: HealthProfile | null;
  setHealthProfile: (profile: HealthProfile | null) => void;

  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      user: null,
      setUser: (user) => set({ user }),

      healthProfile: null,
      setHealthProfile: (healthProfile) => set({ healthProfile }),

      isLoading: false,
      error: null,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'evx-app-store',
      storage: createJSONStorage(getStorage),
      // Only persist non-sensitive UI preferences
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
