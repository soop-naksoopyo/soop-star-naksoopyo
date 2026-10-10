-- Add zzonii (한쪼니) to 더블비 crew
WITH additions(soop_id, nickname, profile_image_url, crew_name) AS (
  VALUES
    ('zzonii', '한쪼니', 'https://profile.img.sooplive.co.kr/LOGO/zz/zzonii/zzonii.jpg', '더블비')
)
INSERT INTO public.streamers (soop_id, nickname, profile_image_url, crew_id, is_active)
SELECT additions.soop_id, additions.nickname, additions.profile_image_url, crews.id, true
FROM additions
JOIN public.crews AS crews ON crews.name = additions.crew_name
ON CONFLICT (soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_id = EXCLUDED.crew_id,
  is_active = true;

INSERT INTO public.soopscope_monthly_roster (year_month, soop_id, nickname, profile_image_url, crew_name)
VALUES
  ('2026-10', 'zzonii', '한쪼니', 'https://profile.img.sooplive.co.kr/LOGO/zz/zzonii/zzonii.jpg', '더블비')
ON CONFLICT (year_month, soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_name = EXCLUDED.crew_name;

-- Remove gpfl5473 (히리캉) and pengmuin (민댕댕) from collection tables and rosters
DELETE FROM public.soopscope_monthly_snapshots
WHERE soop_id IN ('gpfl5473', 'pengmuin');

DELETE FROM public.soopscope_monthly_roster
WHERE soop_id IN ('gpfl5473', 'pengmuin');

DELETE FROM public.poonggo_monthly_snapshots
WHERE soop_id IN ('gpfl5473', 'pengmuin');

DELETE FROM public.monthly_aggregates AS aggregates
USING public.streamers AS streamers
WHERE aggregates.streamer_id = streamers.id
  AND streamers.soop_id IN ('gpfl5473', 'pengmuin');

DELETE FROM public.balloon_snapshots AS snapshots
USING public.streamers AS streamers
WHERE snapshots.streamer_id = streamers.id
  AND streamers.soop_id IN ('gpfl5473', 'pengmuin');

DELETE FROM public.streamers
WHERE soop_id IN ('gpfl5473', 'pengmuin');
