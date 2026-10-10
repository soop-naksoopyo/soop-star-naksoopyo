WITH additions(soop_id, nickname, profile_image_url, crew_name) AS (
  VALUES
    ('koreasbg', 'Stork송병구', 'https://profile.img.sooplive.co.kr/LOGO/ko/koreasbg/koreasbg.jpg', '더블비')
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
  ('2026-10', 'koreasbg', 'Stork송병구', 'https://profile.img.sooplive.co.kr/LOGO/ko/koreasbg/koreasbg.jpg', '더블비')
ON CONFLICT (year_month, soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_name = EXCLUDED.crew_name;
