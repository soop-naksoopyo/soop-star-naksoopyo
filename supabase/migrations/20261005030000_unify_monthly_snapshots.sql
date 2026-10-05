ALTER TABLE public.soopscope_monthly_snapshots
  ADD COLUMN IF NOT EXISTS viewership_status TEXT NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS stars_broadcast_minutes INTEGER NOT NULL DEFAULT 0;

UPDATE public.soopscope_monthly_snapshots
SET stars_broadcast_minutes = broadcast_minutes
WHERE stars_broadcast_minutes = 0 AND broadcast_minutes > 0;

UPDATE public.soopscope_monthly_snapshots
SET viewership_status = collection_status
WHERE viewership_status = 'available'
  AND collection_status = 'unavailable';

INSERT INTO public.soopscope_monthly_snapshots (
  year_month,
  soop_id,
  nickname,
  profile_image_url,
  crew_name,
  average_viewers,
  total_viewers,
  peak_viewers,
  broadcast_minutes,
  stars_broadcast_minutes,
  viewer_ship,
  total_stars,
  stars_source,
  collection_status,
  unavailable_reason,
  viewership_status,
  fetched_at
)
SELECT
  stars.year_month,
  stars.soop_id,
  stars.nickname,
  stars.profile_image_url,
  COALESCE(viewership.crew_name, crews.name),
  COALESCE(viewership.average_viewers, 0),
  COALESCE(viewership.total_viewers, 0),
  COALESCE(viewership.peak_viewers, 0),
  CASE WHEN viewership.collection_status = 'available' THEN viewership.broadcast_minutes ELSE 0 END,
  ROUND(stars.broadcast_hours * 60)::INTEGER,
  COALESCE(viewership.viewer_ship, 0),
  stars.total_stars,
  'poonggo_fallback',
  'available',
  NULL,
  CASE
    WHEN lower(stars.soop_id) IN ('skygkrtn', 'rlekfu6') THEN 'excluded'
    WHEN viewership.collection_status = 'available' THEN 'available'
    ELSE 'unavailable'
  END,
  GREATEST(stars.fetched_at, COALESCE(viewership.fetched_at, stars.fetched_at))
FROM public.poonggo_monthly_snapshots AS stars
LEFT JOIN public.viewership_monthly_archives AS viewership
  ON viewership.year_month = stars.year_month
 AND lower(viewership.soop_id) = lower(stars.soop_id)
LEFT JOIN public.streamers AS streamer
  ON streamer.soop_id = stars.soop_id
LEFT JOIN public.crews AS crews
  ON crews.id = streamer.crew_id
WHERE stars.year_month = '2026-09'
ON CONFLICT (year_month, soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_name = EXCLUDED.crew_name,
  average_viewers = EXCLUDED.average_viewers,
  total_viewers = EXCLUDED.total_viewers,
  peak_viewers = EXCLUDED.peak_viewers,
  broadcast_minutes = EXCLUDED.broadcast_minutes,
  stars_broadcast_minutes = EXCLUDED.stars_broadcast_minutes,
  viewer_ship = EXCLUDED.viewer_ship,
  total_stars = EXCLUDED.total_stars,
  stars_source = EXCLUDED.stars_source,
  collection_status = EXCLUDED.collection_status,
  unavailable_reason = EXCLUDED.unavailable_reason,
  viewership_status = EXCLUDED.viewership_status,
  fetched_at = EXCLUDED.fetched_at;

INSERT INTO public.soopscope_monthly_snapshots (
  year_month,
  soop_id,
  nickname,
  profile_image_url,
  crew_name,
  average_viewers,
  total_viewers,
  peak_viewers,
  broadcast_minutes,
  stars_broadcast_minutes,
  viewer_ship,
  total_stars,
  stars_source,
  collection_status,
  unavailable_reason,
  viewership_status,
  fetched_at
)
SELECT
  viewership.year_month,
  viewership.soop_id,
  viewership.nickname,
  viewership.profile_image_url,
  viewership.crew_name,
  viewership.average_viewers,
  viewership.total_viewers,
  viewership.peak_viewers,
  viewership.broadcast_minutes,
  0,
  viewership.viewer_ship,
  0,
  'stats',
  'available',
  NULL,
  viewership.collection_status,
  viewership.fetched_at
FROM public.viewership_monthly_archives AS viewership
LEFT JOIN public.poonggo_monthly_snapshots AS stars
  ON stars.year_month = viewership.year_month
 AND lower(stars.soop_id) = lower(viewership.soop_id)
WHERE viewership.year_month = '2026-09'
  AND stars.soop_id IS NULL
ON CONFLICT (year_month, soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_name = EXCLUDED.crew_name,
  average_viewers = EXCLUDED.average_viewers,
  total_viewers = EXCLUDED.total_viewers,
  peak_viewers = EXCLUDED.peak_viewers,
  broadcast_minutes = EXCLUDED.broadcast_minutes,
  stars_broadcast_minutes = EXCLUDED.stars_broadcast_minutes,
  viewer_ship = EXCLUDED.viewer_ship,
  viewership_status = EXCLUDED.viewership_status,
  fetched_at = EXCLUDED.fetched_at;

DROP TABLE public.viewership_monthly_archives;
