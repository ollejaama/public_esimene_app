-- Zone time data for manually entered activities (Z0–Z5 seconds)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS manual_zone_seconds jsonb NULL;
