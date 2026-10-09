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
   - Created dedicated Edge API route (`src/app/api/calmmon/route.ts`) that fetches live batch statistics directly from Trackify API (`https://www.trackify.kr/api/v1/p/soop/ranking/summary...`) for all 17 Calmmon members, dynamically populating real-time 별풍선 (`94,002`) and 방송시간 (`39.5h`) with graceful fallback.

8. **Database Persistence with Selective Visibility**:
   - Included `brainzerg7` in `scripts/sync-viewership.mjs` so the 10-minute GitHub Actions crawler automatically pulls and stores his statistics into Supabase (`soopscope_monthly_snapshots`).
   - Added `brainzerg7` to `VIEWERSHIP_EXCLUDED_SOOP_IDS` in `src/lib/viewership.ts`, ensuring he is strictly hidden from the main 뷰어십 (Viewership) leaderboard.
   - Kept `OFFICIAL_STAR_CREWS` in `src/lib/starCrewsData.ts` at 16 members, ensuring his balloon points do not distort the official Star Crew battle scores on the main page (`/`).
   - Kim Yoon-hwan's statistics remain exclusively visible on the dedicated Calmmon page (`/calm`).

9. **SOOP Signature Cyan Live Indicator (Option 1)**:
   - Synchronized Trackify API's real-time `isLive` status into `/api/calmmon` and `calculateCalmmonStats`.
   - On member profile avatars, active streamers (`isLive === true`) receive SOOP's official cyan/sky-blue border ring (`ring-2 ring-[#00c7ff] border border-white shadow-2xs`) and a cyan status dot at the bottom-right corner (`w-2 h-2 rounded-full bg-[#00c7ff] ring-1.5 ring-white`).
   - Inactive streamers retain the clean default avatar frame without visual clutter.
   - Added an indicator item (`● 방송 중 (ON)`) in SOOP cyan to the bottom legend.

10. **Comfortable UI Scaling & Mobile Overflow Prevention**:
   - Following user feedback that the compact view was overly compressed, expanded the card container width from `max-w-2xl` to `max-w-3xl` (~768px).
   - Enlarged profile avatars to `w-6 h-6 sm:w-7 sm:h-7` (24px on mobile, 28px on desktop).
   - **Root Cause & Fix for Mobile Avatar Blowout**: The experimental utility class `w-6.5 h-6.5` was invalid in standard Tailwind CSS, resulting in no width/height CSS on mobile viewports (<640px). This caused avatars to render at intrinsic dimensions (300px+ giant circles). Fixed by constraining both the container and image to explicit `w-6 h-6 sm:w-7 sm:h-7` and adjusting row padding (`px-2 sm:px-2.5`) to prevent Korean nickname truncation.

11. **DM Crew Roster Expansion (예린 `jam0ng`)**:
   - Added `jam0ng` (예린) to DM crew in `src/lib/starCrewsData.ts`.
   - Synchronized live Trackify statistics (15,106 별풍선, 18.4 방송시간, 1,047 뷰어십) into `src/data/viewershipSnapshots.ts`.
   - Updated unit tests (`matchedCount: 241`, `requestedCount: 235`) and deployed to production.

12. **Pure Standalone Private View & Dedicated Favicon (`/calm`)**:
   - Removed the top global `<Header />` ("SOOP 스타크루 대시보드") and the return button (`← 메인 대시보드`) to make the page completely isolated and private.
   - Positioned the month navigator (`< YYYY년 MM월 >`) cleanly at the top-right above the card.
   - Created `src/app/calm/layout.tsx` and a dynamic `useEffect` to assign the official Monstarz 캄몬 emblem (`/crests/26.png`) as the dedicated favicon and set document title to "캄몬스타즈 대시보드".

## Verification
- **Unit Tests**: `vitest run` passed all 49 test suites across 13 test files.
- **Cloudflare Build & Deploy**: Successfully executed `@cloudflare/next-on-pages` and deployed to Cloudflare Pages (`ec3a857c`).
- **Live Visual Validation**: Verified via Playwright:
  - Desktop: `calm_standalone_desktop.png` (Title: "캄몬스타즈 대시보드", Favicon: `/crests/26.png`).
  - Mobile: `calm_standalone_mobile.png` (Completely standalone, ultra-clean headerless card layout).
