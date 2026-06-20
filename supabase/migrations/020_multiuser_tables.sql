-- Migration 020: Multi-user tables
-- Run in Supabase SQL Editor after migrations 001–019

-- Extend profiles with multi-user fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'athlete'
    CHECK (role IN ('athlete', 'coach'));

-- Teams (created by coaches)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual coach-athlete links (outside of teams)
CREATE TABLE IF NOT EXISTS coach_athlete_links (
  coach_id UUID NOT NULL,
  athlete_id UUID NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (coach_id, athlete_id)
);

-- Invites: team_id NULL = individual invite, non-NULL = team invite
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  coach_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index notifications for unread count queries
CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON notifications (user_id, read)
  WHERE read = false;

-- Grant service_role access (bypasses RLS for server-side queries)
GRANT ALL ON public.teams TO service_role;
GRANT ALL ON public.coach_athlete_links TO service_role;
GRANT ALL ON public.invites TO service_role;
GRANT ALL ON public.notifications TO service_role;
