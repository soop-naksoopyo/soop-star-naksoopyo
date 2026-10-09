---
title: Static Avatar and University Crest Bundling with Automated Sync Pipeline
date: 2026-10-09
category: performance
module: assets
problem_type: latency
component: frontend
symptoms:
  - Mobile Safari and desktop browsers experienced visual loading delay on refresh when fetching avatars via Edge API proxy (/api/avatar?id=...)
  - Uncompressed raw SOOP profile images could reach 1.5MB~2.0MB each, totaling over 216MB across 245 streamers
  - College crests for new crews (e.g., 소병대 #90) were missing local assets
  - Need seamless workflow for downloading and reflecting assets whenever new streamers or colleges are added
root_cause: network_latency
resolution_type: architectural_change
severity: major
tags:
  - avatars
  - crests
  - static-assets
  - performance
  - sharp-compression
  - github-actions
  - fallback-handling
---

# Static Avatar and University Crest Bundling with Automated Sync Pipeline

## Problem & Context
When users refreshed the dashboard or browsed on mobile Safari, streamer avatar images experienced noticeable latency. The existing mechanism relied on the `/api/avatar?id=...` Edge API route, which incurred Worker execution latency and external SOOP CDN round-trips. Furthermore:
1. Streaming raw avatars from SOOP meant some streamers had unoptimized 2MB high-resolution images, causing memory and network congestion.
2. College emblems (e.g., 소병대) lacked local static assets in `public/crests/`.
3. The user requested an automated mechanism to download and reflect avatars when new streamers or universities are added in the future.

## Solution

### 1. Static Asset Pre-generation with Sharp Compression
- Downloaded all 245 active streamer avatars into `public/avatars/{soopId}.jpg`.
- Optimized every avatar to a crisp 96x96 retina JPEG (quality 85, mozjpeg) using `sharp`.
- **Drastic Payload Reduction**: Reduced the total avatar asset size from **216MB down to 1.0MB** (99.5% reduction, averaging ~3-4KB per avatar).
- Downloaded and mapped university crests from eloboard, including `90.png` (소병대) in `public/crests/` and mapped in `src/components/CrewCrest.tsx`.

### 2. Zero-Latency Static CDN Serving & 3-Stage Fallback
- Created `src/lib/avatar.ts` with `getStaticAvatarUrl(soopId)` and `handleAvatarError(event, soopId, profileImageUrl)`:
  - **Stage 1 (Primary)**: `/avatars/{cleanId}.jpg` served as a pure static asset from Cloudflare's global edge and browser disk cache (0.00ms latency).
  - **Stage 2 (Proxy Fallback)**: If a newly added streamer does not yet have a local static file, falls back to `/api/avatar?id={cleanId}`.
  - **Stage 3 (Placeholder Fallback)**: If both fail, falls back to `/avatars/default.png` neutral silhouette, preventing broken image icons or infinite retry loops.
- Updated all frontend components (`StreamerRow.tsx`, `CalmmonCard.tsx`, `ViewershipView.tsx`, `RankView.tsx`) to use the new static helper and error handler.

### 3. Automated Sync Script (`scripts/sync-avatars.mjs`) & npm Scripts
- Built `scripts/sync-avatars.mjs` with options:
  - `npm run sync:avatars`: Scans all roster files (`starCrewsData.ts`, `independentStreamers.ts`, `calmmonData.ts`, `septemberStarCrews.ts`) and downloads any missing streamer avatars with concurrency pooling and sharp compression.
  - `npm run sync:crests`: Scans eloboard for university crests and downloads missing emblems to `public/crests/`.
  - `npm run sync:assets`: Executes both avatar and crest synchronization.

### 4. CI/CD GitHub Actions Integration
- Updated `.github/workflows/sync-soopscope.yml`:
  - Automatically runs `node scripts/sync-avatars.mjs` during the 10-minute snapshot sync.
  - Automatically commits and pushes newly downloaded files in `public/avatars/` and `public/crests/` whenever a new streamer or crest is detected.

## Verification
- **Unit Tests**: `vitest run` passed all 15 test files (56 tests), including `src/lib/avatar.test.ts`.
- **Cloudflare Pages Production Deployment**: Successfully deployed to `https://soop-star-naksoopyo.pages.dev` (`4bb5fdd4`).
- **Live Playwright Mobile Verification**:
  - `static_assets_main_mobile.png`: Instant first paint, zero layout shift.
  - `static_assets_calm_mobile.png`: All 17 Calmmon avatars rendered crisply from static CDN.
  - `static_main_members_mobile.png`: All 14 crew crests (including 소병대 #90) and member avatars rendered instantly.
  - Hard refresh completed in 604ms with `networkidle`.
