---
title: Purge 13 Independent Streamers from Active Tracking and Focus Exclusively on Star Crews
date: 2026-10-10
category: feature
module: data
problem_type: data_update
component: roster
symptoms:
  - 13 independent streamers (무소속) were included in individual balloon rankings and viewership snapshots, blurring the site's focus as a dedicated Star Crew / University Dashboard.
root_cause: data_update
resolution_type: feature
severity: minor
tags:
  - roster
  - independent-streamers
  - purge
  - star-crews
  - data-cleanup
---

# Purge 13 Independent Streamers from Active Tracking & Focus Exclusively on Star Crews

## Summary
Purged all 13 independent streamers (`xodud1898`, `yochba0402`, `yjk011599`, `zalalz`, `qpqpro`, `ouo20411`, `sdkels`, `kmj05317`, `rhakdncjs90`, `gks2wl`, `dmsgkdn12`, `forweourus`, `qwer1317`) from active monthly tracking (from October 2026 onward) to align the service exclusively with university/crew competitions.

## Changes Made
1. **Independent Roster Configuration (`src/data/independentStreamers.ts`)**:
   - Cleared `2026-10` and `2026-11` rosters to `[]`.
   - Preserved `2026-09` closed historical archive data.
2. **Snapshot Synchronization (`src/data/viewershipSnapshots.ts`)**:
   - Re-synced October 2026 via `scripts/sync-viewership.mjs`, reducing active tracked streamers from 241 to 228 (227 crew members + 1 캄몬 수장 김윤환).
   - Removed all 13 independent records from `VIEWERSHIP_MONTHLY_SNAPSHOTS['2026-10']`.
3. **Database Migration (`supabase/migrations/20261010211500_purge_independent_streamers.sql`)**:
   - Purged monthly snapshots, monthly rosters, and unassigned streamer records for the 13 streamers from `2026-10` onward.
4. **Unit Tests**:
   - Updated `src/app/api/stats/route.test.ts` (`matchedCount`: 240 -> 227, independent streamers length: 13 -> 0).
   - Updated `src/app/api/viewership/route.test.ts` (`requestedCount`: 234 -> 221, `failedCount`: 233 -> 220).

## Verification
- All 57 vitest unit tests passing (`npm test -- --run`).
- Next.js and Cloudflare Pages build succeeded (`npm run build`).
