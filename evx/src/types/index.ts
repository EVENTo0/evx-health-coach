// ===== CORE TYPES =====

export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'ar';
export type Gender = 'male' | 'female' | 'other';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type Goal = 'fat_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'flexibility' | 'general_health';
export type EquipmentType = 'none' | 'minimal' | 'gym' | 'home_gym';

// ===== USER =====
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

// ===== HEALTH PROFILE =====
export interface HealthProfile {
  id: string;
  user_id: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  fitness_level: FitnessLevel;
  primary_goal: Goal;
  secondary_goals: Goal[];
  health_conditions: string[];
  food_preferences: string[];
  food_restrictions: string[];
  sleep_hours_target: number;
  work_start_time: string;
  work_end_time: string;
  training_start_time: string;
  training_end_time: string;
  training_days: number[];
  equipment: EquipmentType;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ===== WORKOUT =====
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  duration_seconds?: number;
  instructions: string;
  modifications?: string;
  video_cue?: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'recovery';
  duration_minutes: number;
  difficulty: FitnessLevel;
  warm_up: Exercise[];
  main_exercises: Exercise[];
  cool_down: Exercise[];
  notes: string;
  ai_prompt_used?: string;
  completed: boolean;
  scheduled_date?: string;
  created_at: string;
}

// ===== NUTRITION =====
export interface Meal {
  name: string;
  time: string;
  foods: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
}

export interface NutritionPlan {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  water_goal_liters: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
  protein_guidance: string;
  hydration_guidance: string;
  notes: string;
  created_at: string;
}

// ===== LAB =====
export interface LabReport {
  id: string;
  user_id: string;
  file_url: string;
  file_type: 'pdf' | 'image';
  file_name: string;
  report_date?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface LabAnalysis {
  id: string;
  user_id: string;
  lab_report_id: string;
  summary: string;
  educational_explanations: LabMarker[];
  lifestyle_recommendations: string[];
  risk_awareness_notes: string[];
  disclaimer: string;
  created_at: string;
}

export interface LabMarker {
  name: string;
  value: string;
  normal_range: string;
  explanation: string;
  lifestyle_tip?: string;
}

// ===== DAILY PLAN =====
export interface TimelineItem {
  time: string;
  activity: string;
  type: 'sleep' | 'meal' | 'workout' | 'work' | 'recovery' | 'hydration' | 'supplement' | 'other';
  duration_minutes?: number;
  notes?: string;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  date: string;
  timeline: TimelineItem[];
  priorities: string[];
  recovery_reminders: string[];
  motivational_note: string;
  created_at: string;
}

// ===== PROGRESS =====
export interface ProgressLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg?: number;
  waist_cm?: number;
  water_intake_liters?: number;
  sleep_hours?: number;
  workout_completed?: boolean;
  meal_compliance_pct?: number;
  energy_level?: number; // 1–10
  mood?: number; // 1–10
  notes?: string;
  created_at: string;
}

// ===== APP STATE =====
export interface AppState {
  theme: ThemeMode;
  language: Language;
  user: User | null;
  healthProfile: HealthProfile | null;
  isLoading: boolean;
  error: string | null;
}
