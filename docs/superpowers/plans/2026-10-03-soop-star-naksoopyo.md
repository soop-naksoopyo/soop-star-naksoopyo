# 숲 스타크루 낙수표 (SOOP Star Crew Stats) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SOOP(구 아프리카TV) 스타크루(스타대학) 스트리머의 별풍선/방송시간/시급 데이터를 SoopScope API를 통해 1분 주기로 수집하고, 크루별 낙수 현황 및 랭킹을 제공하는 Next.js + Supabase 기반 고속 웹 대시보드 및 관리자 페이지 구축

**Architecture:** Next.js App Router를 프론트엔드 및 API 라우트로 사용하고, Supabase PostgreSQL을 DB로 활용한다. 수집 파이프라인은 SoopScope API(`/api/v2/rank/streamer-period`)를 호출하여 필터링, 변경 감지(Dirty Check) 및 시급 계산 후 DB에 Upsert하며, cron-job.org을 통해 1분마다 자동 트리거된다.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL, Client), Vitest, Lucide React

---

### Task 1: Next.js + TypeScript + Tailwind CSS 기본 세팅 및 Vitest 환경 구축

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vitest.config.ts`
- Create: `src/test/smoke.test.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: package.json 및 기본 설정 파일 생성**

```json
{
  "name": "soop-star-naksoopyo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.441.0",
    "next": "^14.2.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/node": "^20.16.5",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.6.2",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: vitest.config.ts 작성 및 단위 테스트 환경 검증**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: 스모크 테스트 작성 및 실행 확인**

`src/test/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Environment smoke test', () => {
  it('should run tests correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npx vitest run src/test/smoke.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/test/smoke.test.ts
git commit -m "chore: setup next.js, tailwind and vitest environment"
```

---

### Task 2: Supabase DB 스키마 마이그레이션 SQL 및 TypeScript 타입 정의

**Files:**
- Create: `supabase/migrations/20261003_init_schema.sql`
- Create: `src/types/database.ts`

- [ ] **Step 1: 마이그레이션 SQL 파일 작성**

`supabase/migrations/20261003_init_schema.sql`:
```sql
-- 1. 크루 테이블
CREATE TABLE IF NOT EXISTS crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'star', -- 'star' | 'bora' | 'other'
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

-- 3. 별풍선 수집 스냅샷 (1분 주기 스마트 수집)
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

-- 4. 월별 집계 캐시 테이블
CREATE TABLE IF NOT EXISTS monthly_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
    year_month TEXT NOT NULL,
    total_stars INT NOT NULL DEFAULT 0,
    broadcast_hours NUMERIC(10,1) NOT NULL DEFAULT 0.0,
    hourly_stars INT NOT NULL DEFAULT 0,
    prev_month_stars INT DEFAULT 0,
    diff_stars INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(streamer_id, year_month)
);

-- 5. 동기화 실행 로그
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by TEXT NOT NULL,
    status TEXT NOT NULL,
    items_updated INT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

- [ ] **Step 2: TypeScript 데이터베이스 및 엔티티 타입 정의**

`src/types/database.ts`:
```typescript
export interface Crew {
  id: string;
  name: string;
  category: 'star' | 'bora' | 'other';
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Streamer {
  id: string;
  soop_id: string;
  nickname: string;
  profile_image_url?: string | null;
  crew_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MonthlyAggregate {
  id: string;
  streamer_id: string;
  year_month: string;
  total_stars: number;
  broadcast_hours: number;
  hourly_stars: number;
  prev_month_stars: number;
  diff_stars: number;
  updated_at: string;
}

export interface StreamerWithStats extends Streamer {
  stats?: MonthlyAggregate;
}

export interface CrewStatsSummary {
  crew: Crew;
  members: StreamerWithStats[];
  totalStars: number;
  totalHours: number;
  avgStarsPerMember: number;
  avgHourlyStars: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261003_init_schema.sql src/types/database.ts
git commit -m "feat: define database schema migration and typescript interfaces"
```

---

### Task 3: 핵심 계산기 및 포맷터 모듈 구현 (TDD)

5대 핵심 지표: 프로필 사진, 닉네임, 누적 별풍선, 방송시간, 시급(시간당 별풍선)

**Files:**
- Create: `src/lib/calculator.ts`
- Create: `src/lib/calculator.test.ts`

- [ ] **Step 1: 실패하는 단위 테스트 작성**

`src/lib/calculator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateHourlyStars, minutesToHours, formatStars, formatHours } from './calculator';

describe('Calculator Library', () => {
  it('calculates hourly stars accurately', () => {
    // 100,000 별풍선 / 120분 (2시간) = 50,000 개/h
    expect(calculateHourlyStars(100000, 120)).toBe(50000);
  });

  it('handles 0 broadcast minutes gracefully without dividing by zero', () => {
    expect(calculateHourlyStars(5000, 0)).toBe(0);
  });

  it('converts minutes to hours with 1 decimal place', () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(125)).toBe(2.1);
  });

  it('formats star balloon numbers with commas', () => {
    expect(formatStars(1234567)).toBe('1,234,567');
    expect(formatStars(0)).toBe('0');
  });

  it('formats hours with hour unit string', () => {
    expect(formatHours(42.5)).toBe('42.5시간');
  });
});
```

- [ ] **Step 2: 테스트 실행 및 실패 확인**

Run: `npx vitest run src/lib/calculator.test.ts`
Expected: FAIL with "Cannot find module './calculator'"

- [ ] **Step 3: 계산기 모듈 구현**

`src/lib/calculator.ts`:
```typescript
/**
 * 누적 별풍선과 방송시간(분)으로 시간당 별풍선(시급)을 계산합니다.
 */
export function calculateHourlyStars(totalStars: number, totalMinutes: number): number {
  if (!totalMinutes || totalMinutes <= 0) return 0;
  const hours = totalMinutes / 60;
  return Math.round(totalStars / hours);
}

/**
 * 분 단위를 소수점 1자리 시간 단위로 변환합니다.
 */
export function minutesToHours(minutes: number): number {
  if (!minutes || minutes <= 0) return 0.0;
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * 별풍선 숫자에 1,000 단위 콤마를 적용합니다.
 */
export function formatStars(stars: number): string {
  if (stars === null || stars === undefined) return '0';
  return Number(stars).toLocaleString('ko-KR');
}

/**
 * 시간 표시 문자열을 반환합니다.
 */
export function formatHours(hours: number): string {
  return `${hours}시간`;
}
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `npx vitest run src/lib/calculator.test.ts`
Expected: PASS (All 5 tests passing)

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculator.ts src/lib/calculator.test.ts
git commit -m "feat: implement calculator and formatter module with unit tests"
```

---

### Task 4: SoopScope REST API 수집 모듈 구현 (TDD)

**Files:**
- Create: `src/lib/collector.ts`
- Create: `src/lib/collector.test.ts`

- [ ] **Step 1: 실패하는 API 수집기 테스트 작성**

`src/lib/collector.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSoopScopeStreamers, SoopScopeStreamerRow } from './collector';

describe('SoopScope Collector Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses streamer rankings correctly from SoopScope API', async () => {
    const mockApiResponse = {
      rows: [
        {
          rank: 1,
          soopId: 'roket0829',
          nickname: '[JS]박퍼니',
          category: '스타크래프트',
          profileImg: 'https://profile.img.sooplive.co.kr/LOGO/ro/roket0829/roket0829.jpg',
          totalStars: 2656770,
          totalMinutes: 1297,
          hourlyStars: 122904,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await fetchSoopScopeStreamers('2026-10-01', '2026-10-03', 500);

    expect(result).toHaveLength(1);
    expect(result[0].soopId).toBe('roket0829');
    expect(result[0].totalStars).toBe(2656770);
    expect(result[0].totalMinutes).toBe(1297);
  });

  it('handles API error status gracefully by throwing descriptive error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchSoopScopeStreamers('2026-10-01', '2026-10-03')).rejects.toThrow(
      'SoopScope API responded with status 500'
    );
  });
});
```

- [ ] **Step 2: 테스트 실행 및 실패 확인**

Run: `npx vitest run src/lib/collector.test.ts`
Expected: FAIL

- [ ] **Step 3: 수집 모듈 구현**

`src/lib/collector.ts`:
```typescript
export interface SoopScopeStreamerRow {
  rank: number;
  soopId: string;
  nickname: string;
  category: string;
  profileImg: string;
  totalStars: number;
  totalMinutes: number;
  hourlyStars: number;
}

export interface SoopScopeResponse {
  rows: SoopScopeStreamerRow[];
}

/**
 * SoopScope 기간별 랭킹 API를 호출하여 스트리머 별풍선/방송시간 데이터를 가져옵니다.
 */
export async function fetchSoopScopeStreamers(
  startDate: string,
  endDate: string,
  limit: number = 500
): Promise<SoopScopeStreamerRow[]> {
  const url = `https://soopscope.com/api/v2/rank/streamer-period?start=${startDate}&end=${endDate}&limit=${limit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Referer: 'https://soopscope.com/rank',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SoopScope API responded with status ${response.status}`);
  }

  const data: SoopScopeResponse = await response.json();
  return data.rows || [];
}
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `npx vitest run src/lib/collector.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/collector.ts src/lib/collector.test.ts
git commit -m "feat: implement SoopScope API fetch collector with headers"
```

---

### Task 5: 1분 주기 스마트 동기화 라우트 핸들러 (`/api/cron/sync`) 구현

**Files:**
- Create: `src/lib/sync.ts`
- Create: `src/app/api/cron/sync/route.ts`

- [ ] **Step 1: 동기화 오케스트레이션 로직 구현**

`src/lib/sync.ts`:
```typescript
import { fetchSoopScopeStreamers } from './collector';
import { calculateHourlyStars, minutesToHours } from './calculator';
import { Streamer, MonthlyAggregate } from '@/types/database';

export interface SyncResult {
  success: boolean;
  itemsUpdated: number;
  error?: string;
}

/**
 * 등록된 스트리머 목록과 SoopScope 데이터를 매핑하여 월간 집계 데이터를 생성합니다.
 */
export function matchAndAggregate(
  registeredStreamers: Streamer[],
  scrapedRows: Awaited<ReturnType<typeof fetchSoopScopeStreamers>>,
  yearMonth: string
): Array<Omit<MonthlyAggregate, 'id' | 'updated_at'>> {
  const rowMap = new Map(scrapedRows.map((r) => [r.soopId.toLowerCase(), r]));

  return registeredStreamers.map((streamer) => {
    const matched = rowMap.get(streamer.soop_id.toLowerCase());
    const totalStars = matched?.totalStars || 0;
    const totalMinutes = matched?.totalMinutes || 0;
    const hourlyStars = calculateHourlyStars(totalStars, totalMinutes);
    const broadcastHours = minutesToHours(totalMinutes);

    return {
      streamer_id: streamer.id,
      year_month: yearMonth,
      total_stars: totalStars,
      broadcast_hours: broadcastHours,
      hourly_stars: hourlyStars,
      prev_month_stars: 0,
      diff_stars: 0,
    };
  });
}
```

- [ ] **Step 2: API Route Handler 구현**

`src/app/api/cron/sync/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { fetchSoopScopeStreamers } from '@/lib/collector';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${day}`;

    const rows = await fetchSoopScopeStreamers(startDate, endDate, 500);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      rowsFetched: rows.length,
      sample: rows.slice(0, 3),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/sync.ts src/app/api/cron/sync/route.ts
git commit -m "feat: implement 5-minute sync api route handler and aggregation matcher"
```

---

### Task 6: 프론트엔드 대시보드 컴포넌트 구현 (5대 핵심 지표 표시)

5대 핵심 지표: 프로필 사진, 닉네임(방송국 링크), 누적 별풍선, 방송시간, 시급

**Files:**
- Create: `src/components/StreamerRow.tsx`
- Create: `src/components/CrewCard.tsx`
- Create: `src/components/HeroStats.tsx`
- Create: `src/components/CrewDashboard.tsx`

- [ ] **Step 1: 개별 스트리머 행 컴포넌트 구현 (5대 지표)**

`src/components/StreamerRow.tsx`:
```tsx
import React from 'react';
import { formatStars, formatHours } from '@/lib/calculator';

interface StreamerRowProps {
  rank: number;
  soopId: string;
  nickname: string;
  profileImageUrl?: string | null;
  totalStars: number;
  broadcastHours: number;
  hourlyStars: number;
}

export const StreamerRow: React.FC<StreamerRowProps> = ({
  rank,
  soopId,
  nickname,
  profileImageUrl,
  totalStars,
  broadcastHours,
  hourlyStars,
}) => {
  const channelUrl = `https://ch.sooplive.co.kr/${soopId}`;
  const defaultAvatar = `https://profile.img.sooplive.co.kr/LOGO/${soopId.slice(0, 2)}/${soopId}/${soopId}.jpg`;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-pink-50/60 rounded-xl transition border-b border-pink-100/60 last:border-0 text-sm">
      {/* 순위 & 프로필 & 닉네임 */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-bold text-zinc-500 w-5 text-center text-xs">{rank}</span>
        <img
          src={profileImageUrl || defaultAvatar}
          alt={nickname}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://res.sooplive.co.kr/images/user/thumb_user.gif';
          }}
          className="w-9 h-9 rounded-full object-cover border border-pink-200 shadow-2xs"
        />
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-zinc-800 hover:text-pink-600 truncate transition flex items-center gap-1"
        >
          {nickname}
          <span className="text-[10px] text-zinc-400 font-normal">🔗</span>
        </a>
      </div>

      {/* 3대 수치: 누적 별풍선, 방송시간, 시급 */}
      <div className="flex items-center gap-4 text-right">
        <div className="w-24">
          <div className="font-black text-[#881337] tracking-tight font-mono">
            {formatStars(totalStars)}
          </div>
          <div className="text-[10px] text-zinc-400">별풍선</div>
        </div>
        <div className="w-16">
          <div className="font-semibold text-zinc-700 font-mono text-xs">
            {formatHours(broadcastHours)}
          </div>
          <div className="text-[10px] text-zinc-400">방송</div>
        </div>
        <div className="w-20">
          <div className="font-bold text-pink-700 font-mono text-xs">
            {formatStars(hourlyStars)}
          </div>
          <div className="text-[10px] text-zinc-400">시급/h</div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 크루 요약 카드 컴포넌트 구현**

`src/components/CrewCard.tsx`:
```tsx
import React from 'react';
import { StreamerRow } from './StreamerRow';
import { formatStars } from '@/lib/calculator';

interface MemberData {
  soopId: string;
  nickname: string;
  profileImageUrl?: string | null;
  totalStars: number;
  broadcastHours: number;
  hourlyStars: number;
}

interface CrewCardProps {
  crewName: string;
  members: MemberData[];
  totalStars: number;
  avgStarsPerMember: number;
}

export const CrewCard: React.FC<CrewCardProps> = ({
  crewName,
  members,
  totalStars,
  avgStarsPerMember,
}) => {
  const sortedMembers = [...members].sort((a, b) => b.totalStars - a.totalStars);

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-2">
        <div>
          <h3 className="text-lg font-black text-[#581c33] flex items-center gap-2">
            <span>⭐</span> {crewName}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-[#9d2449]">
              {members.length}명
            </span>
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">총 별풍선</div>
          <div className="text-base font-black text-[#881337] font-mono">
            {formatStars(totalStars)}개
          </div>
          <div className="text-[11px] text-pink-600 font-medium font-mono">
            인당 평균: {formatStars(avgStarsPerMember)}개
          </div>
        </div>
      </div>

      <div className="divide-y divide-pink-50">
        {sortedMembers.map((member, idx) => (
          <StreamerRow
            key={member.soopId}
            rank={idx + 1}
            soopId={member.soopId}
            nickname={member.nickname}
            profileImageUrl={member.profileImageUrl}
            totalStars={member.totalStars}
            broadcastHours={member.broadcastHours}
            hourlyStars={member.hourlyStars}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StreamerRow.tsx src/components/CrewCard.tsx
git commit -m "feat: implement StreamerRow and CrewCard components with 5 key metrics"
```

---

### Task 7: 메인 홈 대시보드 뷰 완성 (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/NavTabs.tsx`

- [ ] **Step 1: 상단 헤더 & 내비게이션 탭 컴포넌트 작성**

`src/components/Header.tsx`:
```tsx
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9d2449] to-[#f472b6] flex items-center justify-center text-white text-xl shadow-md shadow-pink-200">
          🌟
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#4a1529] tracking-tight leading-none flex items-center gap-2">
            <span>숲 스타크루 낙수표</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-[#9d2449] font-black border border-pink-200">
              SOOP STAR STATS
            </span>
          </h1>
          <p className="text-[11px] font-semibold text-[#8b5a6c] mt-0.5 tracking-wider uppercase">
            Star University & Crew Real-time Statistics
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-pink-200 rounded-full text-xs font-bold text-[#632b42] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>1분 자동 동기화</span>
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: 메인 페이지에 스타크루 대시보드 연결**

`src/app/page.tsx`:
```tsx
import React from 'react';
import { Header } from '@/components/Header';
import { CrewCard } from '@/components/CrewCard';

// 초기 데모 및 기본 스타크루 데이터
const INITIAL_STAR_CREWS = [
  {
    crewName: '바스포드',
    totalStars: 2840000,
    avgStarsPerMember: 284000,
    members: [
      { soopId: 'roket0829', nickname: '[JS]박퍼니', totalStars: 1450000, broadcastHours: 21.6, hourlyStars: 67129 },
      { soopId: 'galsa', nickname: '두치와뿌꾸', totalStars: 890000, broadcastHours: 18.2, hourlyStars: 48901 },
      { soopId: 'dltndjs', nickname: '찌미', totalStars: 500000, broadcastHours: 15.0, hourlyStars: 33333 }
    ]
  },
  {
    crewName: '철와대',
    totalStars: 2450000,
    avgStarsPerMember: 245000,
    members: [
      { soopId: 'hyeri2244', nickname: '혜응이', totalStars: 1250000, broadcastHours: 19.5, hourlyStars: 64102 },
      { soopId: 'goodb99', nickname: '배그나', totalStars: 780000, broadcastHours: 12.0, hourlyStars: 65000 },
      { soopId: 'hs752952', nickname: '완소리', totalStars: 420000, broadcastHours: 14.5, hourlyStars: 28965 }
    ]
  }
];

export default function HomePage() {
  return (
    <main className="bg-[#fcf5f7] text-[#2b1720] min-h-screen py-6 px-4 sm:px-6 flex flex-col items-center">
      <Header />
      
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {INITIAL_STAR_CREWS.map((crew) => (
          <CrewCard
            key={crew.crewName}
            crewName={crew.crewName}
            totalStars={crew.totalStars}
            avgStarsPerMember={crew.avgStarsPerMember}
            members={crew.members}
          />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/components/Header.tsx
git commit -m "feat: assemble main star crew dashboard page with hero header and cards"
```

---

### Task 8: 관리자(Admin) 센터 구현 (스트리머 등록 및 즉시 수집 트리거)

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/ManualSyncButton.tsx`

- [ ] **Step 1: 즉시 수집 트리거 버튼 컴포넌트 작성**

`src/components/admin/ManualSyncButton.tsx`:
```tsx
'use client';

import React, { useState } from 'react';

export const ManualSyncButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/cron/sync');
      const data = await res.json();
      if (data.success) {
        setMessage(`동기화 성공! (${data.rowsFetched}명 수집 완료)`);
      } else {
        setMessage(`실패: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`에러: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 bg-[#9d2449] hover:bg-[#881337] disabled:bg-zinc-400 text-white font-bold text-xs rounded-xl shadow transition"
      >
        {loading ? '🔄 동기화 중...' : '⚡ 지금 즉시 수집'}
      </button>
      {message && <span className="text-xs font-semibold text-zinc-700">{message}</span>}
    </div>
  );
};
```

- [ ] **Step 2: 관리자 화면 작성**

`src/app/admin/page.tsx`:
```tsx
import React from 'react';
import { ManualSyncButton } from '@/components/admin/ManualSyncButton';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#fcf5f7] p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-pink-200">
        <div>
          <h1 className="text-2xl font-black text-[#581c33]">🛠️ 스타크루 낙수표 관리자 센터</h1>
          <p className="text-xs text-zinc-500 mt-1">크루 편성, 스트리머 매핑 및 수집 관리</p>
        </div>
        <ManualSyncButton />
      </div>

      <div className="mt-8 bg-white p-6 rounded-2xl border border-pink-100 shadow-sm">
        <h2 className="text-lg font-bold text-[#581c33] mb-4">스트리머 추가 및 크루 배정</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="SOOP 아이디 입력 (예: roket0829)"
            className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl text-sm"
          />
          <select className="px-4 py-2 border border-zinc-200 rounded-xl text-sm">
            <option>바스포드</option>
            <option>철와대</option>
            <option>무친대</option>
          </select>
          <button className="px-5 py-2 bg-zinc-900 text-white font-bold text-sm rounded-xl">
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx src/components/admin/ManualSyncButton.tsx
git commit -m "feat: implement admin dashboard with manual sync trigger and streamer management UI"
```

---

### Task 9: GitHub 저장소 연동 및 1분 주기 크론(cron-job.org) 세팅 가이드 문서화

**Files:**
- Create: `README.md`

- [ ] **Step 1: README.md 작성 및 배포/크론 안내 추가**

`README.md`:
```markdown
# 🌟 숲 스타크루 낙수표 (SOOP Star Crew Stats)

SOOP(구 아프리카TV) 스타크루(스타대학) 스트리머의 별풍선/방송시간/시급 현황을 1분 주기로 자동 집계하는 실시간 낙수표 대시보드입니다.

## 🚀 빠른 시작
1. 의존성 설치: `npm install`
2. 테스트 실행: `npm test`
3. 개발 서버 시작: `npm run dev`

## ⚙️ 1분 주기 자동 수집 설정 (cron-job.org)
1. [cron-job.org](https://cron-job.org) 무료 회원가입
2. **Create Cronjob** 클릭
3. URL: `https://내도메인.vercel.app/api/cron/sync`
4. Schedule: **Every 1 minute** 선택
5. 저장 후 1분마다 자동 동기화 활성화
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add readme and 5-minute cron-job.org integration instructions"
```
