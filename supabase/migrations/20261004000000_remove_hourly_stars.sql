-- 시급 지표 제거: 별풍선과 방송시간은 유지합니다.
ALTER TABLE IF EXISTS balloon_snapshots DROP COLUMN IF EXISTS hourly_stars;
ALTER TABLE IF EXISTS monthly_aggregates DROP COLUMN IF EXISTS hourly_stars;
