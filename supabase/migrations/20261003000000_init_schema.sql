-- ============================================================
-- 숲 스타크루 낙수표 (SOOP Star Crew Stats) 초기 DB 스키마
-- ============================================================

-- 1. 크루 테이블 (스타대학 및 크루 정보)
CREATE TABLE IF NOT EXISTS crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'star', -- 'star'(스타크루) | 'bora'(보라크루) | 'other'
    tier TEXT DEFAULT 'major',              -- 'major' | 'minor'
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 스트리머 테이블
CREATE TABLE IF NOT EXISTS streamers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soop_id TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    profile_image_url TEXT,
    crew_id UUID REFERENCES crews(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 별풍선 수집 스냅샷 (1분 주기 스마트 수집 - 변경 시에만 기록)
CREATE TABLE IF NOT EXISTS balloon_snapshots (
    id BIGSERIAL PRIMARY KEY,
    streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
    total_stars INT NOT NULL DEFAULT 0,
    total_minutes INT NOT NULL DEFAULT 0,
    hourly_stars INT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_streamer_time 
ON balloon_snapshots(streamer_id, recorded_at DESC);

-- 4. 월별 집계 캐시 테이블 (대시보드 초고속 조회를 위한 테이블)
CREATE TABLE IF NOT EXISTS monthly_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL,               -- e.g. '2026-10'
    total_stars INT NOT NULL DEFAULT 0,
    broadcast_hours NUMERIC(10,1) NOT NULL DEFAULT 0.0,
    hourly_stars INT NOT NULL DEFAULT 0,
    prev_month_stars INT DEFAULT 0,
    diff_stars INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(streamer_id, year_month)
);

-- 5. 동기화 실행 로그 (1분 주기 실행 이력 모니터링)
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by TEXT NOT NULL,             -- 'cron' | 'admin_manual'
    status TEXT NOT NULL,                   -- 'success' | 'failed'
    items_updated INT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
