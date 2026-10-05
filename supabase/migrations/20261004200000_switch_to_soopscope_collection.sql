ALTER TABLE public.soopscope_monthly_snapshots
  ADD COLUMN IF NOT EXISTS total_stars INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE VIEW public.soopscope_sync_status
WITH (security_barrier = true)
AS
SELECT
  window_start,
  MAX(completed_at) AS completed_at,
  COUNT(*)::INTEGER AS completed_shards,
  BOOL_OR(status <> 'success') AS has_failed_shard,
  COALESCE(SUM(requested_count), 0)::INTEGER AS requested_count,
  COALESCE(SUM(fetched_count), 0)::INTEGER AS fetched_count,
  COALESCE(SUM(failed_count), 0)::INTEGER AS failed_count
FROM public.soopscope_sync_runs
GROUP BY window_start;

GRANT SELECT ON public.soopscope_sync_status TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
