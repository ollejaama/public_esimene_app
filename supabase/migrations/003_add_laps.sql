-- Add activity_laps table for storing Strava lap data
CREATE TABLE public.activity_laps (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id   uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  lap_index     int NOT NULL,
  distance      float NOT NULL DEFAULT 0,   -- meters
  elapsed_time  int NOT NULL,               -- seconds
  moving_time   int,                        -- seconds
  average_speed float,                      -- m/s
  average_hr    float,
  max_hr        float,
  UNIQUE(activity_id, lap_index)
);

ALTER TABLE public.activity_laps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.activity_laps FOR ALL USING (false);
