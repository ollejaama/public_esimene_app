CREATE TABLE interval_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  set_order integer NOT NULL,
  reps integer NOT NULL,
  duration_secs integer NOT NULL,
  zone text NOT NULL CHECK (zone IN ('I2', 'I3', 'I4', 'I5', 'Progressive')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON interval_sets(activity_id);
