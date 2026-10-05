DELETE FROM public.soopscope_monthly_snapshots
WHERE soop_id = 'forweourus';

DELETE FROM public.soopscope_monthly_roster
WHERE soop_id = 'forweourus';

DELETE FROM public.poonggo_monthly_snapshots
WHERE soop_id = 'forweourus';

DELETE FROM public.monthly_aggregates AS aggregates
USING public.streamers AS streamers
WHERE aggregates.streamer_id = streamers.id
  AND streamers.soop_id = 'forweourus';

DELETE FROM public.balloon_snapshots AS snapshots
USING public.streamers AS streamers
WHERE snapshots.streamer_id = streamers.id
  AND streamers.soop_id = 'forweourus';

DELETE FROM public.streamers
WHERE soop_id = 'forweourus';

UPDATE public.soopscope_sync_runs
SET fallback_count = 0
WHERE fallback_count > 0;
