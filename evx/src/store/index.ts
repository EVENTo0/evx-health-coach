import { create } from 'zustand';
import type { ThemeMode, Language, User, HealthProfile } from '../types';

interface AppStore {
  // Theme & UI
  theme: ThemeMode;
  language: Language;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;

  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Health Profile
  healthProfile: HealthProfile | null;
  setHealthProfile: (profile: HealthProfile | null) => void;

  // Loading / Error
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
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
}));
