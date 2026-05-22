-- ============================================================
-- Team plan tables
-- Stores shared training plans set by a coach for a team.
-- Separate from personal planned_activities so team edits
-- don't overwrite an athlete's personal plan.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.team_planned_activities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  date           date NOT NULL,
  sport_type     text NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  description    text,
  time_of_day    text NOT NULL DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'evening')),
  intensity_type text NOT NULL DEFAULT 'regular' CHECK (intensity_type IN ('regular', 'interval', 'speed', 'competition')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_planned_activities_team_date_idx
  ON public.team_planned_activities(team_id, date);

CREATE TABLE IF NOT EXISTS public.team_planned_rest_days (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  date       date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, date)
);

CREATE INDEX IF NOT EXISTS team_planned_rest_days_team_date_idx
  ON public.team_planned_rest_days(team_id, date);

CREATE TABLE IF NOT EXISTS public.team_training_camps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name       text NOT NULL,
  start_date date NOT NULL,
  end_date   date NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_training_camps_team_idx
  ON public.team_training_camps(team_id);

-- ============================================================
-- RLS
-- Service role bypasses RLS for all mutations.
-- Athletes and coaches need SELECT via auth JWT for realtime
-- subscriptions to work (Supabase realtime requires a valid
-- SELECT policy for the rows being watched).
-- ============================================================

ALTER TABLE public.team_planned_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_planned_rest_days  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_training_camps     ENABLE ROW LEVEL SECURITY;

-- Athletes can read their team's plan (needed for realtime)
CREATE POLICY "athlete_read_team_plan_activities" ON public.team_planned_activities
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE athlete_id = auth.uid()
    )
  );

CREATE POLICY "athlete_read_team_rest_days" ON public.team_planned_rest_days
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE athlete_id = auth.uid()
    )
  );

CREATE POLICY "athlete_read_team_camps" ON public.team_training_camps
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members WHERE athlete_id = auth.uid()
    )
  );

-- Coaches can read their teams' plan data (needed for realtime)
CREATE POLICY "coach_read_team_plan_activities" ON public.team_planned_activities
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "coach_read_team_rest_days" ON public.team_planned_rest_days
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "coach_read_team_camps" ON public.team_training_camps
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE coach_id = auth.uid()
    )
  );

-- ============================================================
-- Enable planned_activities for realtime (coach edits → athlete sees)
-- Add a SELECT policy so athletes can subscribe to their own rows.
-- ============================================================

ALTER TABLE public.planned_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athlete_read_own_planned_activities" ON public.planned_activities
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- Realtime publications (errors are suppressed if already added)
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_planned_activities;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_planned_rest_days;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_training_camps;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.planned_activities;
EXCEPTION WHEN others THEN NULL; END $$;
