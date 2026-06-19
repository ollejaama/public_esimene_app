-- Migration 021: Row Level Security
-- Run after migration 020
-- NOTE: All existing app queries use createServiceClient() (service role) which
-- bypasses RLS, so existing functionality is unaffected. RLS protects against
-- direct database access and future authenticated-role queries.

-- Enable RLS on all user-scoped tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_hr_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_gps_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_rest_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_zone_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE illness_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lactate_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interval_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athlete_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only (coach read access added in Session 3)
CREATE POLICY "profiles_own"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

-- Activities: own rows only
CREATE POLICY "activities_own"
  ON activities FOR ALL
  USING (auth.uid() = user_id);

-- HR streams: own rows only
CREATE POLICY "hr_streams_own"
  ON activity_hr_streams FOR ALL
  USING (auth.uid() = user_id);

-- GPS streams: own rows only
CREATE POLICY "gps_streams_own"
  ON activity_gps_streams FOR ALL
  USING (auth.uid() = user_id);

-- Laps: own rows only
CREATE POLICY "laps_own"
  ON activity_laps FOR ALL
  USING (auth.uid() = user_id);

-- Planned activities: own rows only
CREATE POLICY "planned_activities_own"
  ON planned_activities FOR ALL
  USING (auth.uid() = user_id);

-- Planned rest days: own rows only
CREATE POLICY "planned_rest_days_own"
  ON planned_rest_days FOR ALL
  USING (auth.uid() = user_id);

-- Training camps: own rows only
CREATE POLICY "training_camps_own"
  ON training_camps FOR ALL
  USING (auth.uid() = user_id);

-- HR zone settings: own rows only
CREATE POLICY "hr_zone_settings_own"
  ON hr_zone_settings FOR ALL
  USING (auth.uid() = user_id);

-- User settings: own rows only
CREATE POLICY "user_settings_own"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Illness log: own rows only
CREATE POLICY "illness_log_own"
  ON illness_log FOR ALL
  USING (auth.uid() = user_id);

-- Lactate measurements: own rows only
CREATE POLICY "lactate_own"
  ON lactate_measurements FOR ALL
  USING (auth.uid() = user_id);

-- Interval sets: own rows only
CREATE POLICY "interval_sets_own"
  ON interval_sets FOR ALL
  USING (auth.uid() = user_id);

-- Teams: coach manages their own teams
CREATE POLICY "teams_coach"
  ON teams FOR ALL
  USING (auth.uid() = coach_id);

-- Coach-athlete links: coach manages; athlete reads
CREATE POLICY "links_coach"
  ON coach_athlete_links FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "links_athlete_read"
  ON coach_athlete_links FOR SELECT
  USING (auth.uid() = athlete_id);

-- Invites: coach manages; invitee can read their own invites
CREATE POLICY "invites_coach"
  ON invites FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "invites_recipient_read"
  ON invites FOR SELECT
  USING (
    invitee_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Notifications: own only
CREATE POLICY "notifications_own"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);
