-- 018 — Per-user theme preference
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'light'
  CHECK (theme IN ('light', 'dark'));
