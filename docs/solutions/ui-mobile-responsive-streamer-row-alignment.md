---
title: Fix Mobile Clipping and Streamer Row Alignment in Small Screens
date: 2026-10-08
category: ui
module: frontend
problem_type: bug
component: frontend
symptoms:
  - Broadcast hours text collided with right row border on mobile devices
  - Decimal hours (e.g. 163.9시간) caused jagged right margins across rows
  - Table column headers ("별풍선", "방송시간") were misaligned with streamer row values
  - Outer page container risked horizontal scrolling on small mobile screens
root_cause: layout_limitation
resolution_type: bug_fix
severity: minor
tags:
  - mobile
  - responsive
  - streamer-row
  - crew-card
  - column-alignment
  - css-overflow
---

# Fix Mobile Clipping and Streamer Row Alignment in Small Screens

## Problem
On mobile screens (e.g. iPhone Safari, viewport 360px–390px), the streamer leaderboard rows within crew cards experienced visual clipping and misalignments:
1. Streamers with 3-digit or decimal broadcast hours (e.g., `163.9시간`, `100.2시간`) were placed inside a `w-[40px]` container. Because `163.9시간` in 12px font requires ~54px, the text overflowed its bounding box by up to 14px, colliding directly with the row's right border and causing uneven right margins compared to integer hours (e.g. `59시간`).
2. The column headers in `CrewCard.tsx` and `ViewershipView.tsx` had mismatched widths (`w-[42px]` vs row `w-[40px]`, missing width for "별풍선", different gaps), causing the column labels to drift away from the numbers below them.
3. The root `<main>` container lacked explicit overflow containment, allowing slight horizontal drift on narrow touchscreens.

## Symptoms
- On mobile viewports, the Korean text `시간` in long hours strings touched or breached the row border.
- The right edge of the broadcast hours column appeared jagged rather than aligned in a vertical column.
- The column header "별풍선" sat further left than the actual star balloon numbers.

## Root Cause
- In `StreamerRow.tsx`, the hours column was constrained to `w-[40px] sm:w-[46px]`, which is narrower than `formatHours(broadcastHours)` strings with decimals or 3 digits (~50–54px).
- In `CrewCard.tsx`, the column header did not mirror the flex column widths and gaps of `StreamerRow.tsx`.
- Missing `w-full max-w-full overflow-x-hidden` on the page wrapper.

## Solution
1. **Calibrated StreamerRow Column Widths**:
   - Adjusted `StreamerRow.tsx` hours column to `w-[52px] sm:w-[56px]` with `text-[11px] sm:text-xs font-semibold tabular-nums`.
   - Adjusted stars column to `w-[58px] sm:w-[66px]` with `text-[11px] sm:text-xs font-bold tabular-nums`.
   - Result: All hours values (including `163.9시간`) fit cleanly with a consistent 9px padding inside the row, and all `시간` text ends on the exact same vertical coordinate.
2. **Synchronized CrewCard Header Alignment**:
   - Updated `CrewCard.tsx` column header to match `StreamerRow.tsx` exactly:
     - Header right side: `w-[58px] sm:w-[66px]` for "별풍선", `w-[52px] sm:w-[56px]` for "방송시간", `gap-1.5 sm:gap-2`.
     - Header left side: offset "스트리머" label by `pl-[24px]` to align directly over nicknames instead of avatar icons.
3. **Harmonized ViewershipView**:
   - Moved the column header in `ViewershipCrewCard` inside the padded container and aligned its `gap-1` and column track widths to match `CompactStreamerRow`.
4. **Prevented Global Horizontal Scroll**:
   - Added `w-full max-w-full overflow-x-hidden` to `<main>` in `src/app/page.tsx` and `max-w-full overflow-hidden` to `CrewCard.tsx`.

## Verification
- Verified on mobile (390x844) with Playwright:
  - Bounding rect check showed `hoursRight: 355` identically across all rows (48.3h, 62.6h, 163.9h, 59h, 80.9h, 100.2h).
  - Consistent 9px margin to row right border (`gapToRowRight: 9`).
  - Card bounding box cleanly within viewport (`left: 12, right: 378, windowWidth: 390`).
- Verified desktop 4-column layout (`1440x900`): all 4 cards render side-by-side with uniform aligned columns.
- All 43 Vitest tests pass with 0 failures, and Cloudflare Pages production build succeeds.
