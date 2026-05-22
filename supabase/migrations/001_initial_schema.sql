-- ============================================================
-- Training Analytics App — Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PROFILES
-- Standalone user identity — no Supabase Auth dependency.
-- user_id is a UUID generated on first Strava login and stored
-- in the session cookie. Service role key used for all queries.
-- ============================================================
CREATE TABLE public.profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL UNIQUE,
  strava_athlete_id       bigint NOT NULL UNIQUE,
  strava_access_token     text NOT NULL,
  strava_refresh_token    text NOT NULL,
  strava_token_expires_at bigint NOT NULL,  -- unix timestamp seconds
  last_synced_at          timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ACTIVITIES
-- ============================================================
CREATE TABLE public.activities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  strava_id             bigint NOT NULL,
  name                  text NOT NULL,
  sport_type            text NOT NULL,
  custom_sport_tag      text,  -- rollerski_classic | rollerski_skate | crosscountry_classic | cr_skate
  start_date            timestamptz NOT NULL,
  elapsed_time          int NOT NULL,            -- seconds
  distance              float NOT NULL DEFAULT 0, -- meters
  average_hr            float,
  max_hr                float,
  average_speed         float,                   -- m/s
  max_speed             float,                   -- m/s
  average_cadence       float,
  total_elevation_gain  float,
  has_hr_data           bool NOT NULL DEFAULT false,
  has_gps_data          bool NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, strava_id)
);

CREATE INDEX activities_user_start_date_idx ON public.activities (user_id, start_date DESC);
CREATE INDEX activities_sport_type_idx ON public.activities (user_id, sport_type);

-- ============================================================
-- ACTIVITY HR STREAMS
-- hr_data: int[] — one BPM value per second of activity
-- ============================================================
CREATE TABLE public.activity_hr_streams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  hr_data     jsonb NOT NULL,
  UNIQUE(activity_id)
);

-- ============================================================
-- ACTIVITY GPS STREAMS
-- latlng_data: [lat, lng][][] — one coordinate pair per second
-- ============================================================
CREATE TABLE public.activity_gps_streams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  latlng_data jsonb NOT NULL,
  UNIQUE(activity_id)
);

-- ============================================================
-- HR ZONE SETTINGS
-- zone5 is implicitly everything above zone4_max
-- ============================================================
CREATE TABLE public.hr_zone_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE,
  zone1_max   int NOT NULL DEFAULT 130,
  zone2_max   int NOT NULL DEFAULT 148,
  zone3_max   int NOT NULL DEFAULT 162,
  zone4_max   int NOT NULL DEFAULT 174,
  zone1_name  text NOT NULL DEFAULT 'I1',
  zone2_name  text NOT NULL DEFAULT 'I2',
  zone3_name  text NOT NULL DEFAULT 'I3',
  zone4_name  text NOT NULL DEFAULT 'I4',
  zone5_name  text NOT NULL DEFAULT 'I5',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- All queries go through service role key server-side.
-- RLS blocks any accidental direct client access.
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_hr_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_gps_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_zone_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_direct_client" ON public.profiles FOR ALL USING (false);
CREATE POLICY "block_direct_client" ON public.activities FOR ALL USING (false);
CREATE POLICY "block_direct_client" ON public.activity_hr_streams FOR ALL USING (false);
CREATE POLICY "block_direct_client" ON public.activity_gps_streams FOR ALL USING (false);
CREATE POLICY "block_direct_client" ON public.hr_zone_settings FOR ALL USING (false);
