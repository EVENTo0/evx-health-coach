/**
 * EVX AI Service
 *
 * All AI calls are proxied through a Supabase Edge Function.
 * The OpenAI API key NEVER ships inside the app bundle.
 *
 * Edge function: supabase/functions/ai-workflow/index.ts
 * Deploy: `supabase functions deploy ai-workflow --no-verify-jwt`
 */

import { supabase } from './supabase';
import { getRecentSymptoms, summarizeSymptomsForAI } from './symptoms';
import type { HealthProfile, WorkoutPlan, NutritionPlan, LabAnalysis, DailyPlan } from '../types';

// ----------------------------------------------------------------
// Internal: call the AI Workflow edge function
// ----------------------------------------------------------------
const callAIOrchestrator = async (
  workflow: 'workout' | 'nutrition' | 'lab' | 'daily_plan',
  userContext: Record<string, unknown>,
  input: Record<string, unknown>
): Promise<unknown> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('ai-workflow', {
    body: { workflow, userContext, input },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw new Error(error.message ?? 'AI request failed');
  if (data?.error) throw new Error(data.error);
  return data?.data ?? data;
};

// ----------------------------------------------------------------
// Workout Workflow
// ----------------------------------------------------------------
export const generateWorkout = async (
  profile: HealthProfile,
  options?: { duration_minutes?: number; type?: string }
): Promise<Partial<WorkoutPlan>> => {
  const recentSymptoms = await getRecentSymptoms(profile.user_id, 3).catch(() => []);

  const result = await callAIOrchestrator(
    'workout',
    {
      primary_goal: profile.primary_goal,
      fitness_level: profile.fitness_level,
      equipment: profile.equipment,
      health_conditions: profile.health_conditions ?? [],
      recent_symptoms: summarizeSymptomsForAI(recentSymptoms),
    },
    {
      duration_minutes: options?.duration_minutes ?? 60,
      type: options?.type ?? 'strength',
    }
  );
  return result as Partial<WorkoutPlan>;
};

// ----------------------------------------------------------------
// Nutrition Workflow
// ----------------------------------------------------------------
export const generateMealPlan = async (profile: HealthProfile): Promise<Partial<NutritionPlan>> => {
  const recentSymptoms = await getRecentSymptoms(profile.user_id, 3).catch(() => []);

  const result = await callAIOrchestrator(
    'nutrition',
    {
      primary_goal: profile.primary_goal,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      activity_level: profile.activity_level,
      food_preferences: profile.food_preferences ?? [],
      food_restrictions: profile.food_restrictions ?? [],
      recent_symptoms: summarizeSymptomsForAI(recentSymptoms),
    },
    {}
  );
  return result as Partial<NutritionPlan>;
};

// ----------------------------------------------------------------
// Lab Analysis Workflow
// ----------------------------------------------------------------
export const analyzeLabReport = async (
  profile: HealthProfile,
  labText: string
): Promise<Partial<LabAnalysis>> => {
  const result = await callAIOrchestrator(
    'lab',
    {
      primary_goal: profile.primary_goal,
      age: profile.age,
      gender: profile.gender,
    },
    { lab_text: labText }
  );
  return result as Partial<LabAnalysis>;
};

// ----------------------------------------------------------------
// Daily Planning Workflow
// ----------------------------------------------------------------
export const generateDailyPlan = async (
  profile: HealthProfile,
  options?: { has_workout?: boolean; has_meal_plan?: boolean }
): Promise<Partial<DailyPlan>> => {
  const result = await callAIOrchestrator(
    'daily_plan',
    {
      primary_goal: profile.primary_goal,
      work_start_time: profile.work_start_time ?? '08:00',
      work_end_time: profile.work_end_time ?? '16:00',
      training_start_time: profile.training_start_time ?? '17:00',
      training_end_time: profile.training_end_time ?? '19:00',
    },
    {
      has_workout: options?.has_workout ?? false,
      has_meal_plan: options?.has_meal_plan ?? false,
    }
  );
  return result as Partial<DailyPlan>;
};

// ----------------------------------------------------------------
// Progress Insights Workflow (Phase 2)
// ----------------------------------------------------------------
export interface ProgressInsight {
  headline: string;
  summary: string;
  trends: { metric: string; direction: 'up' | 'down' | 'stable'; observation: string }[];
  recommendations: string[];
  motivation: string;
}

export const generateProgressInsights = async (
  profile: HealthProfile,
  logs: unknown[]
): Promise<ProgressInsight> => {
  const result = await callProgressInsightsOrchestrator(
    {
      primary_goal: profile.primary_goal,
      age: profile.age,
      gender: profile.gender,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      activity_level: profile.activity_level,
      recent_symptoms: 'N/A',
    },
    logs
  );
  return result as ProgressInsight;
};

// Internal: progress insights uses a different body shape (passes logs array directly)
const callProgressInsightsOrchestrator = async (
  userContext: Record<string, unknown>,
  logs: unknown[]
): Promise<unknown> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('ai-workflow', {
    body: { workflow: 'progress_insights', userContext, logs },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw new Error(error.message ?? 'AI request failed');
  if (data?.error) throw new Error(data.error);
  return data?.data ?? data;
};
