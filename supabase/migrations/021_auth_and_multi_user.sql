-- ============================================================
-- Multi-user auth schema
-- Depends on Supabase Auth (auth.users) being enabled.
-- Non-destructive: only adds tables/columns, never drops.
-- ============================================================

-- ============================================================
-- USER PROFILES
-- One row per auth.users entry. Stores app-level role and
-- display info. id == auth.users.id.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  role          text NOT NULL CHECK (role IN ('athlete', 'coach')),
  avatar_url    text,
  welcome_sent  bool NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);

-- ============================================================
-- TEAMS
-- A coach owns one or more teams.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  coach_id   uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teams_coach_idx ON public.teams(coach_id);

-- ============================================================
-- TEAM MEMBERS
-- Athletes belong to at most one team (UNIQUE on athlete_id).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id)
);

CREATE INDEX IF NOT EXISTS team_members_team_idx ON public.team_members(team_id);

-- ============================================================
-- COACH–ATHLETE LINKS
-- Direct links independent of team membership, e.g. for coaches
-- following individual athletes outside their main team.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coach_athlete_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS coach_athlete_links_coach_idx   ON public.coach_athlete_links(coach_id);
CREATE INDEX IF NOT EXISTS coach_athlete_links_athlete_idx ON public.coach_athlete_links(athlete_id);

-- ============================================================
-- INVITES
-- Coaches invite athletes by email. Token is used in the
-- invite link; gen_random_uuid() gives a sufficiently unique value.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_email  text NOT NULL,
  invited_by     uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  team_id        uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  token          text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at     timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invites_token_idx ON public.invites(token);
CREATE INDEX IF NOT EXISTS invites_email_idx ON public.invites(invited_email);

-- ============================================================
-- NOTIFICATIONS
-- In-app notifications for coach comments, athlete hearts, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,  -- 'coach_comment' | 'athlete_heart' | 'invite' | 'sync_complete'
  payload    jsonb NOT NULL DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx   ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

-- ============================================================
-- LINK EXISTING PROFILES TO AUTH USERS
-- Allows migrating existing Strava-only profiles to auth accounts.
-- auth_user_id is NULL for legacy rows, set for new users.
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- All app queries use the service role key (bypasses RLS).
-- RLS blocks accidental direct anon/auth client access.
-- user_profiles is the exception: auth users can read/write their own row.
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.teams FOR ALL USING (false);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.team_members FOR ALL USING (false);

ALTER TABLE public.coach_athlete_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.coach_athlete_links FOR ALL USING (false);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.invites FOR ALL USING (false);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.notifications FOR ALL USING (false);
