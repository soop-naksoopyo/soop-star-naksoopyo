UPDATE public.soopscope_monthly_snapshots
SET average_viewers = 0,
    total_viewers = 0,
    peak_viewers = 0,
    broadcast_minutes = 0,
    viewer_ship = 0,
    viewership_status = 'excluded'
WHERE year_month = '2026-09'
  AND lower(soop_id) IN (
    'parkbano',
    'whitedaysen',
    'gpfl5473',
    'jelly97',
    'meezmeun',
    'nvbn114',
    'pengmuin',
    'ehcl000',
    'hasaeyo'
  );
