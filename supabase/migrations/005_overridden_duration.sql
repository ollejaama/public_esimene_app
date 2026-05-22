-- Add overridden_duration to activities
-- Allows manually correcting a Strava elapsed time that was recorded incorrectly.
-- NULL means "use Strava's moving_time / elapsed_time as normal".
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS overridden_duration int;
