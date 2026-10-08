---
title: Calmmon Stars Dedicated Dashboard and Private URL Navigation
date: 2026-10-09
category: ui
module: frontend
problem_type: best_practice
component: frontend
symptoms:
  - User requested a dedicated Calmmon Stars 17-member card view at /calm with Poong-go aesthetic
  - User requested hiding the /calm navigation link from the main menu (accessed via direct URL like /log)
  - User requested excluding the viewership tab from the Calmmon view while keeping stars and broadcast hours
root_cause: feature_request
resolution_type: architectural_change
severity: minor
tags:
  - calmmon-stars
  - dashboard
  - birthday-emoji
  - direct-url-access
  - responsive-cards
---

# Calmmon Stars Dedicated Dashboard and Private URL Navigation

## Problem & Context
The user needed a custom standalone dashboard for "Calmmon Stars" (캄몬스타즈) crew members (total 17 streamers: 6 male, 11 female), mimicking the popular Poong-go 2-column card design.
Key requirements included:
1. Direct URL access only (`/calm`), hidden from the public navigation tabs on the main homepage (`/`), similar to the private admin log console (`/log`).
2. Automatic birthday cake (`🎂`) emoji badge next to streamers whose birthday month matches the active query month (e.g. 주하랑 in October).
3. Display real-time Star Balloon (별풍선) and Broadcast Hours (방송시간) metrics, while leaving Match Counts (스폰 판수) and Donors (후원 랭킹) empty with a "준비 중" badge.
4. Exclude Viewership (뷰어십) tab entirely from the `/calm` page.

## Solution

1. **Standalone Route (`src/app/calm/page.tsx`)**:
   - Created `/calm` with real-time fetching from `/api/stats` and auto-refresh every 60 seconds.
   - Breadcrumb navigation (`← 메인 스타크루 대시보드`) allows returning to the main page while keeping `/calm` isolated.
   - Removed unnecessary calls to `/api/viewership` to keep page loads fast and light.

2. **Clean Main Navigation (`src/components/NavTabs.tsx`)**:
   - Reverted `NavTabs.tsx` to display only the standard `[별풍선]` and `[뷰어십]` tabs.
   - Completely omitted `/calm` links so that casual visitors do not see the secret/custom page, matching the pattern used by `/log`.

3. **Domain Logic & Birthdays (`src/lib/calmmonData.ts`)**:
   - Registered all 17 streamer metadata and birth dates (`MM-DD`).
   - Implemented `isBirthdayMonth(soopId, yearMonth)` which dynamically attaches `isBirthday` flag.
   - Calculated 3 summary stats: Total Sum (`전체 합계`), Female Average (`여자 평균`), and Total Average (`전체 평균`).
   - Configured `boss` highlight styling for leader Kim Yoon-hwan (`brainzerg77`) and percentile tiers (`top1`, `top5`, `top10`).

4. **Poong-go Style Card UI (`src/components/calm/CalmmonCard.tsx`)**:
   - 2-column layout (Left: Male 6, Right: Female 11).
   - Removed the `👀 뷰어십` tab button, leaving `🎈 별풍선`, `⏱️ 방송시간`, `⚔️ 스폰 판수 [준비중]`, `👑 후원 랭킹 [준비중]`.
   - Included 1-click clipboard summary export (`📋 요약 복사`).

5. **Layout Widening & Interactive Month Navigation**:
   - Initial iteration expanded card layout to wide responsive container (`max-w-4xl lg:max-w-5xl`).
   - Removed cluttered text (`26년 10월 · 업데이트 · 출처`) and replaced the `/calm` badge with a clean `← 메인 대시보드` return button.
   - Introduced interactive month navigator (`< YYYY년 MM월 >`) with safe availability guardrails (`AVAILABLE_CALMMON_MONTHS = ['2026-10']`). Months without data (e.g. September 9월 or November 11월) automatically disable navigation buttons (`disabled:opacity-25 disabled:cursor-not-allowed`) to prevent broken/empty views.

6. **Compact Viewport Optimization & SOOP Avatars**:
   - Integrated official SOOP profile avatars (`https://profile.img.sooplive.co.kr/LOGO/{soopId[:2]}/{soopId}/{soopId}.jpg`) with fallback gif next to all 17 streamers' nicknames, linking to their respective live channels (`https://ch.sooplive.co.kr/{soopId}`).
   - Replaced emoji icon with the official Calmmon Stars Crew Emblem (`<CrewCrest crewName="캄몬" size="md" />`).
   - Removed the copy summary button (`📋 요약 복사`) and bottom 2-line redundant notes.
   - Reduced card width to `max-w-2xl` and tightened row/summary box padding so the entire view fits on a 900px viewport with zero vertical scroll (`scrollHeight === clientHeight`).

7. **Kim Yoon-hwan SOOP ID Correction (`brainzerg7`) & Real-time `/api/calmmon` Route**:
   - Corrected Kim Yoon-hwan's SOOP ID from typo `brainzerg77` to official `brainzerg7` in `CALMMON_MEMBERS`, `CALMMON_BIRTHDAYS`, and default stats.
   - Fixed avatar URL resolution to load his authentic SOOP profile photo without 404 fallback.
   - Created dedicated Edge API route (`src/app/api/calmmon/route.ts`) that fetches live batch statistics directly from Trackify API (`https://www.trackify.kr/api/v1/p/soop/ranking/summary...`) for all 17 Calmmon members, dynamically populating real-time 별풍선 (`94,002`) and 방송시간 (`39.4h`) with graceful fallback.

## Verification
- **Unit Tests**: `vitest run` passed all 48 test suites across 13 test files.
- **Cloudflare Build & Deploy**: Successfully executed `@cloudflare/next-on-pages` and deployed to Cloudflare Pages.
- **Live Visual Validation**: Verified via Playwright at 1280x900 resolution (`scrollHeight: 900 clientHeight: 900`). Confirmed Kim Yoon-hwan's official SOOP profile avatar rendering, live Trackify 별풍선 (`94,002`) and 방송시간 (`39.4시간`) displayed accurately with zero vertical scrolling.
