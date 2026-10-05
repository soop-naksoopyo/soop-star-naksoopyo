UPDATE public.soopscope_monthly_snapshots
SET crew_name = NULL,
    average_viewers = 0,
    total_viewers = 0,
    peak_viewers = 0,
    broadcast_minutes = 0,
    viewer_ship = 0,
    viewership_status = 'excluded'
WHERE year_month = '2026-09'
  AND lower(soop_id) IN ('skdidkfl', 'kjhanna824');
