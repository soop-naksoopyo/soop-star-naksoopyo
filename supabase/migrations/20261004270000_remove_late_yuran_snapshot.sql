-- Clear a final snapshot written by a shard that started before the roster removal.
DELETE FROM public.soopscope_monthly_snapshots
WHERE soop_id = 'forweourus';

UPDATE public.soopscope_sync_runs
SET fallback_count = 0
WHERE fallback_count > 0;
