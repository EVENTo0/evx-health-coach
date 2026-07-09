-- ============================================================
-- Migration 007: wearable_snapshots + nutrition_logs tables
-- ============================================================

-- 1. Wearable snapshots (synced daily from Apple Health / Google Fit)
CREATE TABLE IF NOT EXISTS public.wearable_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  steps           INTEGER,
  active_calories NUMERIC,
  resting_heart_rate INTEGER,
  sleep_hours     NUMERIC,
  weight_kg       NUMERIC,
  hrv_ms          NUMERIC,
  vo2_max         NUMERIC,
  blood_oxygen    NUMERIC,
  floors_climbed  INTEGER,
  distance_km     NUMERIC,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.wearable_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY ws_owner   ON public.wearable_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ws_admin   ON public.wearable_snapshots FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_ws_user_date ON public.wearable_snapshots(user_id, date DESC);

-- 2. Nutrition logs (manual macro tracking per meal entry)
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name            TEXT,
  calories_actual      NUMERIC NOT NULL DEFAULT 0,
  protein_actual_g     NUMERIC NOT NULL DEFAULT 0,
  carbs_actual_g       NUMERIC NOT NULL DEFAULT 0,
  fat_actual_g         NUMERIC NOT NULL DEFAULT 0,
  water_actual_liters  NUMERIC NOT NULL DEFAULT 0,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY nl_owner  ON public.nutrition_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY nl_admin  ON public.nutrition_logs FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_nl_user_date ON public.nutrition_logs(user_id, date DESC);

-- 3. Symptom logs (from migration 006 — idempotent)
CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms     TEXT[] NOT NULL DEFAULT '{}',
  severity     SMALLINT CHECK (severity BETWEEN 1 AND 5),
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY sl_owner ON public.symptom_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sl_admin ON public.symptom_logs FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_sl_user_date ON public.symptom_logs(user_id, date DESC);
