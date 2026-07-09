/**
 * EVX Symptom Tracking Service
 *
 * Captures lightweight daily symptom check-ins and feeds recent
 * history into the AI orchestrator so workout/nutrition plans can
 * adapt (e.g. lighter session after poor sleep, hydration focus on
 * headache days). Table: public.symptom_logs (see migration 006).
 */

import { supabase } from './supabase';

export const COMMON_SYMPTOMS = [
  'fatigue',
  'muscle_soreness',
  'headache',
  'nausea',
  'joint_pain',
  'poor_sleep',
  'stress',
  'bloating',
  'low_appetite',
  'none',
] as const;

export type SymptomKey = typeof COMMON_SYMPTOMS[number];

export interface SymptomLog {
  id: string;
  user_id: string;
  date: string;
  symptoms: string[];
  severity: number | null;
  energy_level: number | null;
  notes: string | null;
  created_at: string;
}

/** Upsert today's check-in (one row per user per day). */
export const logSymptoms = async (
  userId: string,
  input: { symptoms: string[]; severity?: number; energy_level?: number; notes?: string }
): Promise<SymptomLog> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('symptom_logs')
    .upsert(
      {
        user_id: userId,
        date: today,
        symptoms: input.symptoms,
        severity: input.severity ?? null,
        energy_level: input.energy_level ?? null,
        notes: input.notes ?? null,
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as SymptomLog;
};

/** Today's check-in, if the user already logged one. */
export const getTodaySymptoms = async (userId: string): Promise<SymptomLog | null> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error) throw error;
  return data as SymptomLog | null;
};

/** Recent history (default 3 days) — used as AI workflow context. */
export const getRecentSymptoms = async (userId: string, days = 3): Promise<SymptomLog[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SymptomLog[];
};

/** Flattens recent logs into a short string for AI prompt context. */
export const summarizeSymptomsForAI = (logs: SymptomLog[]): string => {
  if (!logs.length) return 'No symptoms reported recently.';
  const active = logs.filter((l) => !l.symptoms.includes('none') && l.symptoms.length > 0);
  if (!active.length) return 'No symptoms reported recently.';

  return active
    .map((l) => {
      const sev = l.severity ? ` (severity ${l.severity}/5)` : '';
      const energy = l.energy_level ? `, energy ${l.energy_level}/5` : '';
      return `${l.date}: ${l.symptoms.join(', ')}${sev}${energy}`;
    })
    .join(' | ');
};
