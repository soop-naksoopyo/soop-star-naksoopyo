ALTER TABLE public.soopscope_monthly_snapshots
  ADD COLUMN IF NOT EXISTS collection_status TEXT NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS unavailable_reason TEXT;
