---
title: Update Crew Roster - Add Zzonii to Double B and Purge Dropouts (Hirikang, Mindaengdaeng)
date: 2026-10-10
category: feature
module: data
problem_type: data_update
component: roster
symptoms:
  - Zzonii (한쪼니 / zzonii) joined Double B (더블비) crew but was missing from rosters and tracking.
  - Hirikang (히리캉 / gpfl5473) dropped out (자퇴) from KDA (케이대).
  - Mindaengdaeng (민댕댕 / pengmuin) dropped out (자퇴) from Mabeomdae (마범대).
root_cause: data_update
resolution_type: feature
severity: minor
tags:
  - roster
  - double-b
  - kda
  - mabeomdae
  - zzonii
  - hirikang
  - mindaengdaeng
  - supabase-sync
  - trackify
---

# Update Crew Roster: Add Zzonii to Double B and Purge Dropouts from KDA & Mabeomdae

## Summary
Updated the official star crew rosters and monthly snapshot configurations:
1. Added **한쪼니** (`zzonii`) to **더블비** (Double B).
2. Removed **히리캉** (`gpfl5473`) from **케이대** (KDA) following withdrawal/dropout.
3. Removed **민댕댕** (`pengmuin`) from **마범대** (Mabeomdae) following withdrawal/dropout.

## Changes Made
1. **Roster Configuration (`src/lib/starCrewsData.ts`)**:
   - Added `한쪼니` (`zzonii`) with profile image URL to `더블비`.
   - Removed `히리캉` (`gpfl5473`) from `케이대`.
   - Removed `민댕댕` (`pengmuin`) from `마범대`.
2. **Local Static Avatar Bundling**:
   - Executed `scripts/sync-avatars.mjs` to fetch and optimize `public/avatars/zzonii.jpg` (4.1KB) for high-performance CDN delivery.
3. **Database Migration (`supabase/migrations/20261010204500_update_roster_zzonii_gpfl5473_pengmuin.sql`)**:
   - Upserted `zzonii` into `public.streamers` mapped to `더블비` and `public.soopscope_monthly_roster` for `2026-10`.
   - Purged `gpfl5473` and `pengmuin` from `public.soopscope_monthly_snapshots`, `public.soopscope_monthly_roster`, `public.poonggo_monthly_snapshots`, `public.monthly_aggregates`, `public.balloon_snapshots`, and `public.streamers`.
4. **Data Synchronization**:
   - Executed `scripts/sync-viewership.mjs` for October 2026:
     - Synced `한쪼니` stats: 109,179 별풍선, 39.2 방송시간, 196 평균시청자, 46,277 총시청자.
     - Automatically excluded `gpfl5473` and `pengmuin` from `VIEWERSHIP_MONTHLY_SNAPSHOTS['2026-10']`.
     - Updated `src/data/viewershipSnapshots.ts` and `src/data/syncLogs.ts`.
5. **Unit Tests**:
   - Updated matched count assertions (241 -> 240) in `src/app/api/stats/route.test.ts`.
   - Updated requested count assertions (235 -> 234) and failed count (234 -> 233) in `src/app/api/viewership/route.test.ts`.

## Verification
- All 57 unit tests passed (`npm test -- --run`).
- Next.js & Cloudflare Pages build succeeded (`npm run build`).
