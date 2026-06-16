import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode, Language, User, HealthProfile } from '../types';
import type { SubscriptionStatus, PlanType } from '../services/subscription';

// Lazy-load AsyncStorage so web + tests don't break if native module is absent
const getStorage = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage');
    return AS.default ?? AS;
  } catch {
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

  // Subscription state
  subscription: Partial<SubscriptionStatus>;
  setSubscription: (sub: Partial<SubscriptionStatus>) => void;
  isPremium: () => boolean;

  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      user: null,
      setUser: (user) => set({ user }),

      healthProfile: null,
      setHealthProfile: (healthProfile) => set({ healthProfile }),

      subscription: { isPremium: false, plan: 'free' as PlanType },
      setSubscription: (sub) => set((s) => ({ subscription: { ...s.subscription, ...sub } })),
      isPremium: () => get().subscription?.isPremium === true,

      isLoading: false,
      error: null,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'evx-app-store',
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
