---
title: Add Stork송병구 (koreasbg) to Double B Crew
date: 2026-10-10
category: feature
module: data
problem_type: data_update
component: roster
symptoms:
  - Stork송병구 (koreasbg) was missing from the Double B (더블비) crew roster and star/viewership statistics.
root_cause: data_update
resolution_type: feature
severity: minor
tags:
  - double-b
  - streamer-roster
  - stork
  - koreasbg
  - supabase-sync
  - trackify
---

# Add Stork송병구 (koreasbg) to Double B (더블비) Crew

## Summary
Added `Stork송병구` (`koreasbg`) as an active member of the `더블비` (Double B) crew in the star balloon rankings, viewership tracking, and database sync configurations.

## Changes Made
1. **Roster Configuration (`src/lib/starCrewsData.ts`)**:
   - Added `Stork송병구` (`koreasbg`) to `더블비` crew member list with avatar URL (`https://profile.img.sooplive.co.kr/LOGO/ko/koreasbg/koreasbg.jpg`).
2. **Local Static Avatar Bundling**:
   - Executed `scripts/sync-avatars.mjs` to fetch and optimize `public/avatars/koreasbg.jpg` for low-latency, immutable CDN delivery.
3. **Database Migration (`supabase/migrations/20261010141500_add_koreasbg_to_double_b.sql`)**:
   - Registered `koreasbg` into `public.streamers` mapped to the `더블비` crew.
   - Upserted `koreasbg` into `public.soopscope_monthly_roster` for `2026-10`.
4. **Data Synchronization**:
   - Synced October 2026 statistics via Trackify batch collector (`scripts/sync-viewership.mjs`):
     - Captured balloon stars (22,349), broadcast hours (44.3h), average viewers (273), and total viewers (73,687).
     - Updated `src/data/viewershipSnapshots.ts` and `src/data/syncLogs.ts`.
5. **Unit Tests**:
   - Updated total streamer matched count assertions (240 -> 241) and viewership requested counts (234 -> 235) in `src/app/api/stats/route.test.ts` and `src/app/api/viewership/route.test.ts`.

## Verification
- All 57 vitest unit tests passing (`npm test -- --run`).
- Cloudflare Pages build succeeded (`npm run pages:build`).
- Cloudflare Pages production deployment verified.
