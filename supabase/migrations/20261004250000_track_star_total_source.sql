ALTER TABLE public.soopscope_monthly_snapshots
  ADD COLUMN IF NOT EXISTS stars_source TEXT NOT NULL DEFAULT 'stats';

UPDATE public.soopscope_monthly_snapshots
SET stars_source = 'poonggo_fallback'
WHERE collection_status = 'poonggo_fallback';
