-- Allow invites to target a known user_id (name-search path).
-- Nullable: email-only invites leave this NULL.
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS invited_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS invites_user_idx ON public.invites(invited_user_id)
  WHERE invited_user_id IS NOT NULL;
