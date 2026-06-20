-- Migration 024: Coach comment & athlete heart columns on activities
-- Run in Supabase SQL Editor after migrations 001–023

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS coach_comment TEXT,
  ADD COLUMN IF NOT EXISTS coach_comment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coach_comment_unread BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS athlete_heart BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS athlete_heart_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS athlete_heart_unread BOOLEAN NOT NULL DEFAULT false;
