UPDATE public.crews
SET name = '극락회'
WHERE name = '광준';

WITH additions(soop_id, nickname, profile_image_url, crew_name) AS (
  VALUES
    ('dkwkal', '탱크~_~', 'https://profile.img.sooplive.co.kr/LOGO/dk/dkwkal/dkwkal.jpg', '드림즈'),
    ('psi050217', '태이22', 'https://profile.img.sooplive.co.kr/LOGO/ps/psi050217/psi050217.jpg', 'BGM')
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

UPDATE public.soopscope_monthly_roster
SET crew_name = '극락회'
WHERE crew_name = '광준';

UPDATE public.soopscope_monthly_snapshots
SET crew_name = '극락회'
WHERE crew_name = '광준';

INSERT INTO public.soopscope_monthly_roster (year_month, soop_id, nickname, profile_image_url, crew_name)
VALUES
  ('2026-10', 'dkwkal', '탱크~_~', 'https://profile.img.sooplive.co.kr/LOGO/dk/dkwkal/dkwkal.jpg', '드림즈'),
  ('2026-10', 'psi050217', '태이22', 'https://profile.img.sooplive.co.kr/LOGO/ps/psi050217/psi050217.jpg', 'BGM')
ON CONFLICT (year_month, soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_name = EXCLUDED.crew_name;
