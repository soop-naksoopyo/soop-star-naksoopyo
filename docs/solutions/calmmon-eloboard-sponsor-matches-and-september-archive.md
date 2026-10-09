---
title: Calmmon Eloboard Sponsor Match Integration and Monthly Archive Architecture
date: 2026-10-09
category: best-practices
module: calmmon
problem_type: best_practice
component: development_workflow
severity: medium
applies_when:
  - Integrating external esports match counts (Eloboard) with live streaming metrics (Trackify)
  - Managing multi-month archives (September and October) with 10-minute periodic cron syncs
tags:
  - calmmon
  - eloboard
  - match-count
  - monthly-archive
  - cloudflare-pages
  - edge-cache
---

# Calmmon Eloboard Sponsor Match Integration and Monthly Archive Architecture

## Context
캄몬스타즈(17명) 전용 대시보드([`/calm`](https://soop-star-naksoopyo.pages.dev/calm))에서 기존에 제공하던 별풍선(후원)과 방송시간 지표 외에, 스타크래프트 대학 대전의 핵심 지표인 **"스폰 판수(경기수)"**를 추가해야 했습니다.
스폰 경기수는 [Eloboard](https://eloboard.com/ranking)에 기록되는데, 17명을 매번 개별 쿼리(`?q=이름`)로 부르면 17번의 HTTP 요청이 발생하여 로딩 지연 및 서버 차단 위험이 있습니다.
또한 10월뿐만 아니라 **9월 마감 데이터**도 함께 조회할 수 있도록 월간 네비게이터(`<` `>`)와 10분 주기 자동 동기화 크롤러에 연동하는 통합 아키텍처가 필요했습니다.

## Guidance

### 1. Eloboard 전적 일괄 수집 최적화 (17번 ➡️ 4번)
- Eloboard는 월간 전체 랭킹 페이지(`https://eloboard.com/ranking?month=${month}&page=${p}`)에서 1페이지당 50명씩 스타크래프트 선수 전적을 반환합니다.
- 1~4페이지(총 186명 선수)만 스크래핑하면, 캄몬 17명 전원의 이번 달 경기수가 단 4번의 요청(약 0.8초)으로 100% 수집됩니다.
- 수집된 데이터는 `src/data/calmmonMatches.json`에 월별(`2026-09`, `2026-10`)로 체계적으로 저장합니다.

### 2. 10분 주기 GitHub Actions 크롤러 연동
- `.github/workflows/sync-soopscope.yml`에 `node scripts/sync-calmmon-matches.mjs`를 추가하여,
  1) Trackify 뷰어십/별풍선/방송시간 동기화
  2) 신규 아바타/엠블럼 동기화
  3) Eloboard 스폰 판수 동기화
  가 모두 10분 간격으로 한 번에 실행되도록 구성했습니다.
- 방문자 브라우저는 외부 사이트(Eloboard)를 직접 호출하지 않고, Cloudflare 엣지 CDN에서 0ms로 데이터를 즉시 불러옵니다.

### 3. 2026년 9월 마감 데이터 아카이빙
- 9월 캄몬 17명 전원의 최종 수치(별풍선 443만개, 방송시간 2,333시간, 스폰 판수 245판)를 검증하여 `CALMMON_SEPTEMBER_STATS`로 영구 박제했습니다.
- `/api/calmmon?month=2026-09` 호출 시 1주일 단위 불변 캐시(`Cache-Control: public, max-age=86400, s-maxage=604800, immutable`)로 즉시 응답합니다.
- 상단 월 넘김 네비게이터를 `['2026-09', '2026-10']` (향후 11월 자동 추가)로 확장하여, 사용자가 과거 월과 현재 월을 언제든 클릭 한 번으로 비교 조회할 수 있습니다.

### 4. UI 탭 정식 활성화
- `src/components/calm/CalmmonCard.tsx`에서 `⚔️ 스폰 판수` 탭의 "준비중" 뱃지를 제거하고 정식 오픈했습니다.
- 스폰 판수 1위(임조이 32판 등) 뱃지, 전체 합계(180판), 여자 평균(14.2판), 전체 평균(10.6판) 요약 카드를 완벽히 렌더링하도록 반영했습니다.

## Why This Matters
- **0ms 방문자 경험**: 브라우저에서 무거운 크롤링이나 CORS 우회 없이 사전 집계된 캐시 데이터를 로드하므로 모바일/데스크톱 모두 쾌속 서빙됩니다.
- **영구 보존성**: 11월, 12월 등 새로운 달이 시작되어도 지난달의 마감 지표가 날아가지 않고 온전히 보존됩니다.

## Examples

### 월간 네비게이터 동적 계산
```typescript
function getAvailableCalmmonMonths(): string[] {
  const currentYM = getCurrentMonthDate().slice(0, 7);
  const base = ['2026-09', '2026-10'];
  if (currentYM > '2026-10' && !base.includes(currentYM)) {
    base.push(currentYM);
  }
  return base;
}
```

### Eloboard 4페이지 일괄 수집
```javascript
for (let p = 1; p <= 4; p++) {
  const res = await fetch(`https://eloboard.com/ranking?month=${month}&page=${p}`, { headers: { 'User-Agent': userAgent } });
  const html = await res.text();
  const matches = [...html.matchAll(/ranking-module__T882VG__nm">([^<]+)<\/span>[\s\S]*?ranking-module__T882VG__num[^"]*">(\d+)</g)];
  for (const m of matches) {
    nameToCount.set(m[1].trim(), parseInt(m[2], 10));
  }
}
```
