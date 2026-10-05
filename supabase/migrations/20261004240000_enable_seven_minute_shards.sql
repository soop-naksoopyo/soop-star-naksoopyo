ALTER TABLE public.soopscope_sync_runs
  ADD COLUMN IF NOT EXISTS shard_count SMALLINT NOT NULL DEFAULT 5;

ALTER TABLE public.soopscope_sync_runs
  DROP CONSTRAINT IF EXISTS soopscope_sync_runs_shard_index_check;

ALTER TABLE public.soopscope_sync_runs
  ADD CONSTRAINT soopscope_sync_runs_shard_index_check
    CHECK (shard_count IN (5, 7) AND shard_index >= 0 AND shard_index < shard_count);

ALTER TABLE public.soopscope_sync_runs
  DROP CONSTRAINT IF EXISTS soopscope_sync_runs_pkey;

ALTER TABLE public.soopscope_sync_runs
  ADD PRIMARY KEY (window_start, shard_count, shard_index);

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
  COALESCE(SUM(failed_count), 0)::INTEGER AS failed_count,
  COALESCE(SUM(fallback_count), 0)::INTEGER AS fallback_count,
  MAX(shard_count)::INTEGER AS expected_shards
FROM public.soopscope_sync_runs
GROUP BY window_start, shard_count;

GRANT SELECT ON public.soopscope_sync_status TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
