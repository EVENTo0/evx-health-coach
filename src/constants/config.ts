// App Configuration
export const APP_CONFIG = {
  name: 'EVX',
  fullName: 'EVX – AI Health Coach',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar'],
};

// API Config — replace with real values via .env
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
// AI credentials belong only in the server-side Edge Function environment.

// Health defaults
export const HEALTH_DEFAULTS = {
  waterGoalLiters: 3.0,
  sleepGoalHours: 8,
  calorieGoal: 2000,
  proteinGoalG: 150,
  stepsGoal: 10000,
};

// AI Model config
export const AI_CONFIG = {
  model: 'gpt-4o',
  maxTokens: 2000,
  temperature: 0.7,
};
