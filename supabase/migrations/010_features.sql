-- ============================================================
-- 008 — Hide, Partial Contribution, Manual Activity, Rest Days
-- Run manually in Supabase SQL Editor
-- ============================================================

-- Feature 1: Hide activity
ALTER TABLE public.activities ADD COLUMN hidden boolean NOT NULL DEFAULT false;

-- Feature 2: Partial contribution
ALTER TABLE public.activities ADD COLUMN contribution_hours float;

-- Feature 3: Manual activity entry
ALTER TABLE public.activities ALTER COLUMN strava_id DROP NOT NULL;
ALTER TABLE public.activities DROP CONSTRAINT activities_user_id_strava_id_key;
CREATE UNIQUE INDEX activities_user_strava_unique
  ON public.activities (user_id, strava_id)
  WHERE strava_id IS NOT NULL;
ALTER TABLE public.activities ADD COLUMN is_manual boolean NOT NULL DEFAULT false;

-- Feature 5: Rest day threshold
ALTER TABLE public.hr_zone_settings
  ADD COLUMN rest_day_threshold_minutes int NOT NULL DEFAULT 0;
