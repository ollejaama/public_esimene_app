ALTER TABLE activity_gps_streams
  ADD COLUMN IF NOT EXISTS elevation_data jsonb;
