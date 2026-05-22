-- ============================================================
-- Planned Activities
-- Coach-facing training planner — stores planned sessions
-- ============================================================

CREATE TABLE public.planned_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date             date NOT NULL,
  sport_type       text NOT NULL,
  duration_minutes int NOT NULL,
  description      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX planned_activities_user_date_idx ON public.planned_activities (user_id, date);

-- ============================================================
-- ROW LEVEL SECURITY
-- All queries go through service role key server-side.
-- ============================================================
ALTER TABLE public.planned_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block_direct_client" ON public.planned_activities FOR ALL USING (false);
