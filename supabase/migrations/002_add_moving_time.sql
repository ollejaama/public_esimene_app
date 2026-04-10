-- Add moving_time column to activities
-- moving_time = actual training time excluding pauses (from Strava)
-- elapsed_time = wall-clock time including pauses
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS moving_time int;
