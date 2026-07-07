-- ================================================================
-- EVX — Critical fix: RLS policies, auth trigger, and storage
-- policies that were defined in 001/002 but never actually applied
-- to the live database. Safe to re-run (idempotent).
-- ================================================================

-- ---------- 1. TABLE RLS POLICIES (were missing entirely) ----------
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own health profile" ON health_profiles;
CREATE POLICY "Users can manage own health profile" ON health_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own workouts" ON workouts;
CREATE POLICY "Users can manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meal plans" ON meal_plans;
CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own lab reports" ON lab_reports;
CREATE POLICY "Users can manage own lab reports" ON lab_reports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own lab analysis" ON lab_analysis;
CREATE POLICY "Users can manage own lab analysis" ON lab_analysis
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own daily plans" ON daily_plans;
CREATE POLICY "Users can manage own daily plans" ON daily_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own progress logs" ON progress_logs;
CREATE POLICY "Users can manage own progress logs" ON progress_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- 2. AUTO-CREATE public.users ROW ON SIGNUP (never existed) ----------
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

-- Backfill: create public.users rows for anyone who already signed up
-- before this trigger existed (currently affects existing test accounts)
INSERT INTO public.users (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------- 3. updated_at TRIGGERS (function existed, triggers didn't) ----------
DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON health_profiles;
CREATE TRIGGER update_health_profiles_updated_at
  BEFORE UPDATE ON health_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------- 4. STORAGE POLICIES (buckets existed, policies never did) ----------
DROP POLICY IF EXISTS "Users can upload own lab reports" ON storage.objects;
CREATE POLICY "Users can upload own lab reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lab_reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view own lab reports" ON storage.objects;
CREATE POLICY "Users can view own lab reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lab_reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own lab reports" ON storage.objects;
CREATE POLICY "Users can delete own lab reports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lab_reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
