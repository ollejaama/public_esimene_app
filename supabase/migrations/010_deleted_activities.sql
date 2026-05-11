CREATE TABLE public.deleted_activities (
  user_id   uuid   NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  strava_id bigint NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, strava_id)
);
