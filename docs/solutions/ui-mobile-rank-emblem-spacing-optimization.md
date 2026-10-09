---
title: Optimize Mobile Spacing Between Crew Emblem and Star Count in RankView
date: 2026-10-10
category: ui
module: frontend
problem_type: cosmetic_bug
component: frontend
symptoms:
  - Mobile individual star balloon ranking list displayed crew emblems immediately adjacent to star balloon counts with near-zero visual separation.
  - Crowded visual appearance on narrow mobile screens (375px~390px).
root_cause: layout_limitation
resolution_type: bug_fix
severity: minor
tags:
  - mobile
  - responsive
  - rank-view
  - spacing
  - visual-polish
---

# Optimize Mobile Spacing Between Crew Emblem and Star Count in RankView

## Problem
On mobile viewports (e.g., 375px–390px), in the personal star balloon leaderboard (`RankView.tsx`), the crew affiliation emblem column (`CrewAffiliation`) was positioned directly next to the star balloon numbers with almost no visible spacing (~2px gap). This caused the numbers and the emblem to appear cramped together.

## Symptoms
- In mobile screens, the crew emblem (e.g. 24px icon) was directly pressed against the left edge of the star balloon count text (e.g. `143,378`).
- Visually cluttered and lacked breathing room between streamer identity (emblem) and quantitative stats (star balloons).

## Root Cause
- In `RankView.tsx`, the mobile affiliation container was sized to `w-8` (32px), with no right margin or horizontal gap between the affiliation column and the right stat column.
- While the previous nickname truncation fix widened the nickname area by shrinking the emblem container to `w-8`, it left inadequate separation between the 24px emblem image and the adjacent numeric data.

## Solution
1. **Added Mobile Margin to Affiliation Column**:
   - In `src/components/RankView.tsx`:
     - Added `mr-2.5 sm:mr-0` to the column header (`div className="w-8 shrink-0 text-center sm:w-16 mr-2.5 sm:mr-0"`).
     - Added `mr-2.5 sm:mr-0` to each streamer row's affiliation cell (`div className="flex w-8 shrink-0 items-center justify-center sm:w-16 mr-2.5 sm:mr-0"`).
2. **Preserved Desktop Layout**:
   - Desktop view (`sm:`) retains its wide layout (`sm:w-16`, `sm:mr-0`, `sm:gap-6`) without any disruption.
3. **Preserved Streamer Nickname Visibility**:
   - 10px spacing (`mr-2.5`) provides comfortable separation while maintaining sufficient width for streamer nicknames (`Fresh토마토`, `Best도재욱` etc.) without truncation or ellipsis.

## Verification
- Verified on mobile viewport (390x844) via Playwright screenshot:
  - Confirmed comfortable 10px spacing between all crew emblems and star balloon numbers.
  - Confirmed nicknames across Top 1~11 are 100% visible without text truncation.
- Automated tests: `npm test` passed (57/57 tests passing).
- Cloudflare Pages deployment verified successfully.
