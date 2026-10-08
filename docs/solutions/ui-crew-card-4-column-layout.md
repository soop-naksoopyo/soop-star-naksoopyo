---
title: Star Crew Dashboard 4-Column Responsive Layout Transformation
date: 2026-10-08
category: ui
module: frontend
problem_type: best_practice
component: frontend
symptoms:
  - User requested reducing card width to place 4 crew cards side-by-side in one row
root_cause: layout_limitation
resolution_type: architectural_change
severity: minor
tags:
  - ui-layout
  - grid
  - responsive
  - crew-card
  - viewership
---

# Star Crew Dashboard 4-Column Responsive Layout Transformation

## Problem
In the Star Crew Dashboard, the college/crew cards were previously limited to a 2-column grid (`lg:grid-cols-2`), with each card internally using a 2-column streamer layout. This caused significant vertical scrolling to inspect multiple crews, and wide screens did not take advantage of the horizontal space to view top crews simultaneously.

## Symptoms
- Only 2 crew cards were visible per row on desktop and wide screens.
- Inspecting rankings 1 through 4 required scrolling down.

## Solution
1. **Grid Expansion & Container Optimization**:
   - Expanded grid from `grid-cols-1 lg:grid-cols-2` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-start` in both `src/app/page.tsx` and `src/components/ViewershipView.tsx`.
   - Increased container max width to `1720px` (`max-w-7xl 2xl:max-w-[1720px]`).
2. **Compact 1-Column Internal Streamer Layout**:
   - Streamlined `CrewCard.tsx` and `ViewershipCrewCard` to display members in a single-column top-to-bottom leaderboard order instead of alternating 2-column zig-zagging.
   - Refined padding (`p-3 sm:p-3.5`), header text truncation, and streamer row widths (`w-[58px]` stars, `w-[40px]` broadcast hours) in `StreamerRow.tsx` and `CompactStreamerRow`.
3. **Harmonized Viewership Tab**:
   - Synchronized `ViewershipView.tsx` with the exact same 4-card grid and 1-column compact card layout.

## Why This Works
By converting each card's internal layout to a single column, card width can safely drop down to ~230px~400px without clipping names or numbers. This allows 4 cards (ranks 1 to 4) to be displayed side-by-side horizontally on standard desktop displays (1024px+ and 1600px+).

## Prevention
- Always ensure card contents have flexible min-widths (`min-w-0 flex-1 truncate`) when placing multiple cards in a responsive grid.
- Keep the 별풍선(Star) and 뷰어십(Viewership) tabs unified in grid breakpoints.
