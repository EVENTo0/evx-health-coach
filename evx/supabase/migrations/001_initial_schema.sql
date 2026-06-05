-- ================================================================
-- EVX Health Coach — Complete Database Schema
-- Version: 1.0.0
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- USERS (extends Supabase auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- HEALTH PROFILES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL CHECK (age >= 10 AND age <= 120),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_cm NUMERIC(5,1) NOT NULL CHECK (height_cm > 0),
  weight_kg NUMERIC(5,1) NOT NULL CHECK (weight_kg > 0),
  activity_level TEXT NOT NULL DEFAULT 'moderately_active'
    CHECK (activity_level IN ('sedentary','lightly_active','moderately_active','very_active','extremely_active')),
  fitness_level TEXT NOT NULL DEFAULT 'intermediate'
    CHECK (fitness_level IN ('beginner','intermediate','advanced')),
  primary_goal TEXT NOT NULL DEFAULT 'general_health'
    CHECK (primary_goal IN ('fat_loss','muscle_gain','maintenance','endurance','flexibility','general_health')),
  secondary_goals TEXT[] DEFAULT '{}',
  health_conditions TEXT[] DEFAULT '{}',
  food_preferences TEXT[] DEFAULT '{}',
  food_restrictions TEXT[] DEFAULT '{}',
  sleep_hours_target NUMERIC(4,1) DEFAULT 8 CHECK (sleep_hours_target >= 4 AND sleep_hours_target <= 12),
  work_start_time TEXT DEFAULT '08:00',
  work_end_time TEXT DEFAULT '16:00',
  training_start_time TEXT DEFAULT '17:00',
  training_end_time TEXT DEFAULT '19:00',
  training_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  equipment TEXT DEFAULT 'gym'
    CHECK (equipment IN ('none','minimal','home_gym','gym')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ================================================================
-- GOALS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weight','body_fat','strength','endurance','habit','custom')),
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- WORKOUTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'strength'
    CHECK (type IN ('strength','cardio','hiit','flexibility','recovery')),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  difficulty TEXT NOT NULL DEFAULT 'intermediate'
    CHECK (difficulty IN ('beginner','intermediate','advanced')),
  warm_up JSONB DEFAULT '[]',
  main_exercises JSONB DEFAULT '[]',
  cool_down JSONB DEFAULT '[]',
  notes TEXT,
  ai_prompt_used TEXT,
  completed BOOLEAN DEFAULT FALSE,
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_scheduled_date ON workouts(scheduled_date);
CREATE INDEX idx_workouts_completed ON workouts(completed);

-- ================================================================
-- MEAL PLANS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories INTEGER,
  total_protein_g NUMERIC(6,1),
  total_carbs_g NUMERIC(6,1),
  total_fat_g NUMERIC(6,1),
  water_goal_liters NUMERIC(4,1) DEFAULT 3.0,
  breakfast JSONB,
  lunch JSONB,
  dinner JSONB,
  snacks JSONB DEFAULT '[]',
  protein_guidance TEXT,
  hydration_guidance TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_date ON meal_plans(date);

-- ================================================================
-- LAB REPORTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lab_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_name TEXT NOT NULL,
  report_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_reports_user_id ON lab_reports(user_id);

-- ================================================================
-- LAB ANALYSIS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.lab_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  educational_explanations JSONB DEFAULT '[]',
  lifestyle_recommendations TEXT[] DEFAULT '{}',
  risk_awareness_notes TEXT[] DEFAULT '{}',
  disclaimer TEXT NOT NULL DEFAULT 'This information is educational and not medical advice. Always consult your healthcare provider.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_report_id)
);

-- ================================================================
-- DAILY PLANS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  timeline JSONB NOT NULL DEFAULT '[]',
  priorities TEXT[] DEFAULT '{}',
  recovery_reminders TEXT[] DEFAULT '{}',
  motivational_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX idx_daily_plans_date ON daily_plans(date);

-- ================================================================
-- PROGRESS LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,1) CHECK (weight_kg > 0 AND weight_kg < 500),
  waist_cm NUMERIC(5,1) CHECK (waist_cm > 0 AND waist_cm < 300),
  water_intake_liters NUMERIC(4,1) CHECK (water_intake_liters >= 0 AND water_intake_liters <= 20),
  sleep_hours NUMERIC(4,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  workout_completed BOOLEAN DEFAULT FALSE,
  meal_compliance_pct NUMERIC(5,1) CHECK (meal_compliance_pct >= 0 AND meal_compliance_pct <= 100),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_progress_logs_user_id ON progress_logs(user_id);
CREATE INDEX idx_progress_logs_date ON progress_logs(date);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Health profiles policies
CREATE POLICY "Users can manage own health profile" ON health_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Meal plans policies
CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lab reports policies
CREATE POLICY "Users can manage own lab reports" ON lab_reports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lab analysis policies
CREATE POLICY "Users can manage own lab analysis" ON lab_analysis
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily plans policies
CREATE POLICY "Users can manage own daily plans" ON daily_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Progress logs policies
CREATE POLICY "Users can manage own progress logs" ON progress_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- TRIGGERS: Auto-create user profile on signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_health_profiles_updated_at
  BEFORE UPDATE ON health_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
