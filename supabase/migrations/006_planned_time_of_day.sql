ALTER TABLE public.planned_activities
  ADD COLUMN IF NOT EXISTS time_of_day text NOT NULL DEFAULT 'morning';
