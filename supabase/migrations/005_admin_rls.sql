-- ============================================================
-- 005_admin_rls.sql
-- Adds admin role support so the admin dashboard can run on the
-- ANON key (authenticated as a real admin user) instead of the
-- service role key, which must never be shipped to a browser.
-- ============================================================

-- 1. Add the admin flag
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Helper function (SECURITY DEFINER avoids RLS recursion when
--    policies below query public.users to check the flag)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- 3. Admin full-access policies on every table the admin dashboard touches.
--    These are ADDITIVE — existing per-user policies keep working for
--    normal app users, admins just get an extra "OR is_admin()" path.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','articles','videos','subscriptions','lab_reports','meal_plans','streaks','workouts']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS admin_full_access ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY admin_full_access ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())',
        t
      );
    END IF;
  END LOOP;
END $$;

-- 4. Grant yourself admin access — replace with your real login email,
--    then run this line (safe to re-run).
-- UPDATE public.users SET is_admin = true WHERE email = 'YOUR_ADMIN_EMAIL_HERE';
