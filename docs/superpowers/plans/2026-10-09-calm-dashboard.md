# 캄몬스타즈 전용 대시보드 (/calm) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/calm` URL에 캄몬스타즈 17명(남 6 · 여 11)의 별풍선, 방송시간, 뷰어십 데이터를 우리 시스템과 실시간 연동하고, 생일 달 케이크(`🎂`) 이모지 자동 표시 및 풍고 스타일 2열 카드로 제공하며 배포한다.

**Architecture:** Next.js App Router(`src/app/calm/page.tsx`)에서 `/api/stats` 및 `/api/viewership` 데이터를 조회하고, `src/lib/calmmonData.ts`의 메타데이터(남/여, 수장여부, 생일 `MM-DD`)와 결합하여 `CalmmonCard` 컴포넌트로 렌더링한다. 스폰 판수와 후원 랭킹은 빈 데이터/준비 중 뱃지로 노출한다.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, Lucide-react, Vitest, Cloudflare Pages.

---

### Task 1: 캄몬스타즈 메타데이터 및 집계 유틸 구현 & 단위 테스트

**Files:**
- Create: `src/lib/calmmonData.ts`
- Create: `src/test/calmmonData.test.ts`

- [ ] **Step 1: 실패하는 단위 테스트 작성 (`src/test/calmmonData.test.ts`)**

```typescript
import { describe, it, expect } from 'vitest';
import {
  CALMMON_MEMBERS,
  isBirthdayMonth,
  calculateCalmmonStats,
  type CalmmonTabType,
} from '@/lib/calmmonData';

describe('calmmonData', () => {
  it('총 17명(남자 6명, 여자 11명) 메타데이터가 존재해야 한다', () => {
    expect(CALMMON_MEMBERS.length).toBe(17);
    const male = CALMMON_MEMBERS.filter((m) => m.gender === 'male');
    const female = CALMMON_MEMBERS.filter((m) => m.gender === 'female');
    expect(male.length).toBe(6);
    expect(female.length).toBe(11);
  });

  it('해당 월이 생일인 멤버에게 isBirthdayMonth가 true를 반환해야 한다', () => {
    // 주하랑 (10-08)
    expect(isBirthdayMonth('fpahsdltu1', '2026-10')).toBe(true);
    expect(isBirthdayMonth('fpahsdltu1', '2026-11')).toBe(false);
    // 김윤환 (06-13)
    expect(isBirthdayMonth('brainzerg77', '2026-06')).toBe(true);
    expect(isBirthdayMonth('brainzerg77', '2026-10')).toBe(false);
  });

  it('별풍선 탭 기준 남/여 정렬 및 합계/평균이 올바르게 계산되어야 한다', () => {
    const mockStatsMap = new Map([
      ['brainzerg77', { totalStars: 80000, broadcastHours: 30, averageViewers: 3000 }],
      ['freshtomato', { totalStars: 150000, broadcastHours: 60, averageViewers: 1000 }],
    ]);

    const result = calculateCalmmonStats(mockStatsMap, 'star', '2026-10');
    expect(result.male[0].nickname).toBe('김윤환');
    expect(result.female[0].nickname).toBe('토마토');
    expect(result.totalSum).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/test/calmmonData.test.ts`
Expected: FAIL with module `@/lib/calmmonData` not found.

- [ ] **Step 3: `src/lib/calmmonData.ts` 구현**

```typescript
export type Gender = 'male' | 'female';
export type CalmmonTabType = 'star' | 'time' | 'view' | 'spon' | 'donor';

export interface CalmmonMemberMeta {
  soopId: string;
  nickname: string;
  gender: Gender;
  isBoss?: boolean;
}

export const CALMMON_MEMBERS: CalmmonMemberMeta[] = [
  // 남자 (6명)
  { soopId: 'brainzerg77', nickname: '김윤환', gender: 'male', isBoss: true },
  { soopId: 'minchul', nickname: '김민철', gender: 'male' },
  { soopId: 'h78ert', nickname: '박준오', gender: 'male' },
  { soopId: 'jmc06170', nickname: '왜냐맨', gender: 'male' },
  { soopId: 'hoonykkk', nickname: '사테', gender: 'male' },
  { soopId: 'goodzerg', nickname: '배성흠', gender: 'male' },
  // 여자 (11명)
  { soopId: 'freshtomato', nickname: '토마토', gender: 'female' },
  { soopId: 'seemin88', nickname: '비타밍', gender: 'female' },
  { soopId: 'wjswlgns09', nickname: '지두두', gender: 'female' },
  { soopId: '2meonjin', nickname: '먼진', gender: 'female' },
  { soopId: 'fpahsdltu1', nickname: '주하랑', gender: 'female' },
  { soopId: 'sksmsskdsl10', nickname: '낭니', gender: 'female' },
  { soopId: 'thelddl', nickname: '햇살', gender: 'female' },
  { soopId: 'rnaqpdrjf', nickname: '남덕선', gender: 'female' },
  { soopId: 'vldpfm2', nickname: '아리송이', gender: 'female' },
  { soopId: 'dlaguswl501', nickname: '임조이', gender: 'female' },
  { soopId: 'soju2022', nickname: '소주양', gender: 'female' },
];

// 멤버별 생일 매핑 ("MM-DD" 포맷, 언제든 추가/수정 가능)
export const CALMMON_BIRTHDAYS: Record<string, string> = {
  brainzerg77: '06-13', // 김윤환
  minchul: '12-10',     // 김민철
  h78ert: '06-24',      // 박준오
  jmc06170: '06-17',    // 왜냐맨
  freshtomato: '08-05', // 토마토
  fpahsdltu1: '10-08',  // 주하랑 (10월 생일 🎂)
};

export function isBirthdayMonth(soopId: string, yearMonth: string): boolean {
  const bday = CALMMON_BIRTHDAYS[soopId.toLowerCase()];
  if (!bday || !yearMonth) return false;
  const month = yearMonth.slice(5, 7);
  const birthMonth = bday.slice(0, 2);
  return month === birthMonth;
}

export interface CalmmonMemberRow {
  soopId: string;
  nickname: string;
  gender: Gender;
  isBoss?: boolean;
  isBirthday: boolean;
  rawVal: number;
  displayVal: string;
  tierBadge?: 'top1' | 'top5' | 'top10' | 'boss';
}

export interface CalmmonStatsResult {
  male: CalmmonMemberRow[];
  female: CalmmonMemberRow[];
  totalSum: number;
  totalSumStr: string;
  femaleAvg: number;
  femaleAvgStr: string;
  totalAvg: number;
  totalAvgStr: string;
}

export function calculateCalmmonStats(
  statsMap: Map<string, { totalStars?: number; broadcastHours?: number; averageViewers?: number }>,
  tab: CalmmonTabType,
  yearMonth: string
): CalmmonStatsResult {
  const isBdayCheck = (bday: string) => isBirthdayMonth(bday, yearMonth);

  const rows: CalmmonMemberRow[] = CALMMON_MEMBERS.map((m) => {
    const s = statsMap.get(m.soopId.toLowerCase());
    let rawVal = 0;
    let displayVal = '0';

    if (tab === 'star') {
      rawVal = s?.totalStars || 0;
      displayVal = rawVal.toLocaleString();
    } else if (tab === 'time') {
      rawVal = s?.broadcastHours || 0;
      displayVal = `${rawVal.toFixed(1)}시간`;
    } else if (tab === 'view') {
      rawVal = s?.averageViewers || 0;
      displayVal = `${rawVal.toLocaleString()}명`;
    } else {
      rawVal = 0;
      displayVal = '-';
    }

    return {
      soopId: m.soopId,
      nickname: m.nickname,
      gender: m.gender,
      isBoss: m.isBoss,
      isBirthday: isBdayCheck(m.birthday),
      rawVal,
      displayVal,
    };
  });

  // 티어 배지 계산 (전체 값 기준)
  const sortedAll = [...rows].sort((a, b) => b.rawVal - a.rawVal);
  const totalCount = sortedAll.length;
  sortedAll.forEach((row, idx) => {
    if (row.isBoss) {
      row.tierBadge = 'boss';
    } else if (idx < Math.ceil(totalCount * 0.05)) {
      row.tierBadge = 'top5';
    } else if (idx < Math.ceil(totalCount * 0.15)) {
      row.tierBadge = 'top10';
    }
  });

  const male = rows.filter((r) => r.gender === 'male').sort((a, b) => b.rawVal - a.rawVal);
  const female = rows.filter((r) => r.gender === 'female').sort((a, b) => b.rawVal - a.rawVal);

  const totalSum = rows.reduce((acc, cur) => acc + cur.rawVal, 0);
  const femaleSum = female.reduce((acc, cur) => acc + cur.rawVal, 0);
  const femaleAvg = female.length ? Math.round(femaleSum / female.length) : 0;
  const totalAvg = totalCount ? Math.round(totalSum / totalCount) : 0;

  let unit = tab === 'star' ? '개' : tab === 'view' ? '명' : tab === 'time' ? '시간' : '';
  return {
    male,
    female,
    totalSum,
    totalSumStr: `${tab === 'time' ? totalSum.toFixed(1) : totalSum.toLocaleString()}${unit}`,
    femaleAvg,
    femaleAvgStr: `${tab === 'time' ? femaleAvg.toFixed(1) : femaleAvg.toLocaleString()}${unit}`,
    totalAvg,
    totalAvgStr: `${tab === 'time' ? totalAvg.toFixed(1) : totalAvg.toLocaleString()}${unit}`,
  };
}
```

- [ ] **Step 4: 테스트 실행하여 성공 확인**

Run: `npx vitest run src/test/calmmonData.test.ts`
Expected: PASS with 3 tests passing.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/calmmonData.ts src/test/calmmonData.test.ts
git commit -m "feat(calm): add Calmmon members metadata, birthday helper and stat calculator"
```

---

### Task 2: 풍고 스타일 컴포넌트 (`src/components/calm/`) 구현

**Files:**
- Create: `src/components/calm/CalmmonCard.tsx`

- [ ] **Step 1: 풍고 스타일 2열 카드 컴포넌트 `CalmmonCard.tsx` 작성**
  - 상단 5개 탭 (`별풍선`, `방송시간`, `뷰어십`, `스폰 판수(준비중)`, `후원 랭킹(준비중)`)
  - 남자 6명 / 여자 11명 2열 테이블
  - 생일 달 케이크(`🎂`) 이모지 렌더링
  - 수장 붉은색 하이라이트 배지 및 상위 5%/10% 배지
  - 하단 전체합계 / 여자평균 / 전체평균 3칸 통계 박스
  - 하단 범례

- [ ] **Step 2: 캡처 및 클립보드 복사 버튼 핸들러 연동**

- [ ] **Step 3: 커밋**

```bash
git add src/components/calm/CalmmonCard.tsx
git commit -m "feat(calm): add CalmmonCard component with 2-column layout and birthday cake badge"
```

---

### Task 3: `/calm` 페이지 라우트 (`src/app/calm/page.tsx`) 구현

**Files:**
- Create: `src/app/calm/page.tsx`

- [ ] **Step 1: `/calm` 페이지 컴포넌트 구현**
  - `/api/stats` 호출하여 캄몬 17명 실시간 데이터 수집
  - 뷰어십 데이터 조회 연동
  - 로딩 스켈레톤 및 반응형 레이아웃 구성
  - 상단 글로벌 Header 포함

- [ ] **Step 2: 로컬 빌드 검증 (`npm run build`)**

Run: `npm run build`
Expected: Successfully generates `/calm` static/edge route without errors.

- [ ] **Step 3: 커밋**

```bash
git add src/app/calm/page.tsx
git commit -m "feat(calm): create /calm page route and integrate live stats data"
```

---

### Task 4: 로컬 동작 및 브라우저 검증

**Files:**
- Test: Playwright 스크립트로 `http://localhost:3000/calm` 캡처 검증

- [ ] **Step 1: `next dev` 실행 또는 로컬 빌드 서버 검증**
- [ ] **Step 2: `/calm` 페이지 캡처 및 탭 전환 검증 스크린샷 저장**
- [ ] **Step 3: 커밋**

---

### Task 5: Cloudflare Pages 배포 및 최종 라이브 검증

**Files:**
- Run: `npm run deploy`

- [ ] **Step 1: `npm run deploy` 실행**
- [ ] **Step 2: 라이브 URL `https://soop-star-naksoopyo.pages.dev/calm` 정상 접속 확인**
- [ ] **Step 3: 최종 솔루션 문서화 (`ce:compound`)**
