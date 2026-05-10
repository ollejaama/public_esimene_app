ALTER TABLE planned_activities
  ADD COLUMN IF NOT EXISTS intensity_type text NOT NULL DEFAULT 'regular';

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS intensity_type text;
