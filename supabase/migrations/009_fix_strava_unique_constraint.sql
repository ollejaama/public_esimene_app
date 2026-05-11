-- ============================================================
-- 009 — Restore full unique constraint on (user_id, strava_id)
-- Run manually in Supabase SQL Editor
--
-- Migration 008 replaced the original constraint with a partial
-- unique index (WHERE strava_id IS NOT NULL), which breaks the
-- sync upsert: PostgreSQL's ON CONFLICT (col1, col2) cannot
-- resolve a partial index target, causing silent insert failures.
--
-- The original full constraint already handles manual activities
-- correctly: PostgreSQL treats NULLs as distinct in UNIQUE
-- constraints, so multiple rows with strava_id IS NULL are
-- permitted per user without violating uniqueness.
-- ============================================================

DROP INDEX IF EXISTS public.activities_user_strava_unique;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_user_id_strava_id_key
  UNIQUE (user_id, strava_id);
