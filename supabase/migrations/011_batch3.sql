-- Batch 3: athlete logging features

-- Per-user feature toggles (RPE, lactate)
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  show_rpe boolean NOT NULL DEFAULT false,
  rpe_scale text NOT NULL DEFAULT 'rpe',
  show_lactate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RPE / effort rating on activities
ALTER TABLE activities ADD COLUMN rpe integer NULL;

-- Coach comments + athlete heart reaction
ALTER TABLE activities ADD COLUMN coach_comment text NULL;
ALTER TABLE activities ADD COLUMN coach_comment_at timestamptz NULL;
ALTER TABLE activities ADD COLUMN coach_comment_unread boolean NOT NULL DEFAULT false;
ALTER TABLE activities ADD COLUMN athlete_heart boolean NOT NULL DEFAULT false;
ALTER TABLE activities ADD COLUMN athlete_heart_at timestamptz NULL;
ALTER TABLE activities ADD COLUMN athlete_heart_unread boolean NOT NULL DEFAULT false;

-- Cached aerobic decoupling percentage (computed on first expanded-view load)
ALTER TABLE activities ADD COLUMN decoupling_percent float NULL;

-- Illness / injury log
CREATE TABLE illness_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('sick', 'injured', 'fatigue')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lactate measurements (multiple per activity)
CREATE TABLE lactate_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value_mmol float NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
