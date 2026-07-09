-- ============================================================
-- 006_symptom_logs.sql
-- Adds daily symptom check-ins, feeding real-time symptom data
-- into the AI workout/nutrition workflows (per architecture spec).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  severity SMALLINT CHECK (severity BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS symptom_logs_owner ON public.symptom_logs;
CREATE POLICY symptom_logs_owner ON public.symptom_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS admin_full_access ON public.symptom_logs;
CREATE POLICY admin_full_access ON public.symptom_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON public.symptom_logs(user_id, date DESC);
