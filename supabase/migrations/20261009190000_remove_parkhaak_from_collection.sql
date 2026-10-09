DELETE FROM public.soopscope_monthly_snapshots
WHERE soop_id = 'qkrgkdms01';

DELETE FROM public.soopscope_monthly_roster
WHERE soop_id = 'qkrgkdms01';

DELETE FROM public.poonggo_monthly_snapshots
WHERE soop_id = 'qkrgkdms01';

DELETE FROM public.monthly_aggregates AS aggregates
USING public.streamers AS streamers
WHERE aggregates.streamer_id = streamers.id
  AND streamers.soop_id = 'qkrgkdms01';

DELETE FROM public.balloon_snapshots AS snapshots
USING public.streamers AS streamers
WHERE snapshots.streamer_id = streamers.id
  AND streamers.soop_id = 'qkrgkdms01';

DELETE FROM public.streamers
WHERE soop_id = 'qkrgkdms01';
