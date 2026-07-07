import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';
import type { HealthProfile, WorkoutPlan, NutritionPlan, LabReport, LabAnalysis, DailyPlan, ProgressLog } from '../types';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ===== AUTH =====
export const authService = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'evx://reset-password',
    });
    if (error) throw error;
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};

// ===== HEALTH PROFILE =====
export const healthProfileService = {
  get: async (userId: string): Promise<HealthProfile | null> => {
    const { data, error } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  upsert: async (profile: Partial<HealthProfile> & { user_id: string }): Promise<HealthProfile> => {
    const { data, error } = await supabase
      .from('health_profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ===== WORKOUTS =====
export const workoutService = {
  list: async (userId: string): Promise<WorkoutPlan[]> => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (workout: Omit<WorkoutPlan, 'id' | 'created_at'>): Promise<WorkoutPlan> => {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workout)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan> => {
    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  markCompleted: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('workouts')
      .update({ completed: true })
      .eq('id', id);
    if (error) throw error;
  },
};

// ===== NUTRITION =====
export const nutritionService = {
  list: async (userId: string): Promise<NutritionPlan[]> => {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getByDate: async (userId: string, date: string): Promise<NutritionPlan | null> => {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  create: async (plan: Omit<NutritionPlan, 'id' | 'created_at'>): Promise<NutritionPlan> => {
    const { data, error } = await supabase
      .from('meal_plans')
      .insert(plan)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ===== LAB REPORTS =====
export const labService = {
  list: async (userId: string): Promise<LabReport[]> => {
    const { data, error } = await supabase
      .from('lab_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  create: async (report: Omit<LabReport, 'id' | 'created_at'>): Promise<LabReport> => {
    const { data, error } = await supabase
      .from('lab_reports')
      .insert(report)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateStatus: async (id: string, status: LabReport['status']): Promise<void> => {
    const { error } = await supabase
      .from('lab_reports')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  uploadFile: async (userId: string, file: Blob, fileName: string): Promise<string> => {
    const path = `${userId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from('lab_reports')
      .upload(path, file);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('lab_reports')
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  getAnalysis: async (labReportId: string): Promise<LabAnalysis | null> => {
    const { data, error } = await supabase
      .from('lab_analysis')
      .select('*')
      .eq('lab_report_id', labReportId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  saveAnalysis: async (analysis: Omit<LabAnalysis, 'id' | 'created_at'>): Promise<LabAnalysis> => {
    const { data, error } = await supabase
      .from('lab_analysis')
      .insert(analysis)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ===== DAILY PLAN =====
export const dailyPlanService = {
  getByDate: async (userId: string, date: string): Promise<DailyPlan | null> => {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  create: async (plan: Omit<DailyPlan, 'id' | 'created_at'>): Promise<DailyPlan> => {
    const { data, error } = await supabase
      .from('daily_plans')
      .insert(plan)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  list: async (userId: string, limit = 7): Promise<DailyPlan[]> => {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};

// ===== PROGRESS =====
export const progressService = {
  list: async (userId: string, days = 30): Promise<ProgressLog[]> => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  upsert: async (log: Omit<ProgressLog, 'id' | 'created_at'>): Promise<ProgressLog> => {
    const { data, error } = await supabase
      .from('progress_logs')
      .upsert(log, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getLatest: async (userId: string): Promise<ProgressLog | null> => {
    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};
