/**
 * EVX AI Service
 *
 * All AI calls are proxied through a Supabase Edge Function.
 * The OpenAI API key NEVER ships inside the app bundle.
 *
 * Edge function: supabase/functions/ai-orchestrator/index.ts
 * Deploy: `supabase functions deploy ai-orchestrator --no-verify-jwt`
 */

import { supabase } from './supabase';
import type { HealthProfile, WorkoutPlan, NutritionPlan, LabAnalysis, DailyPlan } from '../types';

// ----------------------------------------------------------------
// Internal: call the AI Orchestrator edge function
// ----------------------------------------------------------------
const callAIOrchestrator = async (
  workflow: 'workout' | 'nutrition' | 'lab' | 'daily_plan',
  payload: Record<string, unknown>
): Promise<unknown> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
    body: { workflow, ...payload },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw new Error(error.message ?? 'AI request failed');
  return data;
};

// ----------------------------------------------------------------
// Workout Workflow
// ----------------------------------------------------------------
export const generateWorkout = async (profile: HealthProfile): Promise<Partial<WorkoutPlan>> => {
  const result = await callAIOrchestrator('workout', { profile });
  return result as Partial<WorkoutPlan>;
};

// ----------------------------------------------------------------
// Nutrition Workflow
// ----------------------------------------------------------------
export const generateMealPlan = async (profile: HealthProfile): Promise<Partial<NutritionPlan>> => {
  const result = await callAIOrchestrator('nutrition', { profile });
  return result as Partial<NutritionPlan>;
};

// ----------------------------------------------------------------
// Lab Analysis Workflow
// ----------------------------------------------------------------
export const analyzeLabReport = async (
  profile: HealthProfile,
  labText: string
): Promise<Partial<LabAnalysis>> => {
  const result = await callAIOrchestrator('lab', { profile, lab_text: labText });
  return result as Partial<LabAnalysis>;
};

// ----------------------------------------------------------------
// Daily Planning Workflow
// ----------------------------------------------------------------
export const generateDailyPlan = async (
  profile: HealthProfile,
  date: string
): Promise<Partial<DailyPlan>> => {
  const result = await callAIOrchestrator('daily_plan', { profile, date });
  return result as Partial<DailyPlan>;
};
