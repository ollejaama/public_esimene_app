-- Coaches don't have Strava accounts, so these columns must be nullable
ALTER TABLE profiles ALTER COLUMN strava_athlete_id DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN strava_access_token DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN strava_refresh_token DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN strava_token_expires_at DROP NOT NULL;
