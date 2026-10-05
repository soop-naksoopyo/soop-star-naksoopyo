-- 카나에_ joins Shinsegae; 시라소니aa leaves Sobyeongdae but remains active and uncategorized.
INSERT INTO public.streamers (soop_id, nickname, profile_image_url, crew_id, is_active)
SELECT
  'a6r8zfymkc6',
  '카나에_',
  'https://profile.img.sooplive.co.kr/LOGO/a6/a6r8zfymkc6/a6r8zfymkc6.jpg',
  crews.id,
  true
FROM public.crews AS crews
WHERE crews.name = '신세계'
ON CONFLICT (soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_id = EXCLUDED.crew_id,
  is_active = true;

UPDATE public.streamers
SET
  nickname = '시라소니aa',
  profile_image_url = 'https://profile.img.sooplive.co.kr/LOGO/pa/parkbano/parkbano.jpg',
  crew_id = NULL,
  is_active = true
WHERE soop_id = 'parkbano';
