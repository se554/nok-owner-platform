-- Add guesty_activated_at to track when listing was created in Guesty
-- Used for occupancy proration (don't count days before listing was active)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS guesty_activated_at timestamptz;

COMMENT ON COLUMN public.properties.guesty_activated_at IS
  'When the listing was activated in Guesty, used for occupancy proration';
