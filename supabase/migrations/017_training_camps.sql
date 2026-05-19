CREATE TABLE training_camps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON training_camps(user_id, start_date);
