# Light Theme Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전체 SOOP 스타크루 낙수표 웹 애플리케이션을 기존 다크톤(`#090c11`, `#0f141d`)에서 프리미엄 화이트 & 소프트 슬레이트 라이트 테마(`#f8fafc`, `#ffffff`)로 전면 개편합니다.

**Architecture:** Tailwind CSS 유틸리티 클래스를 기반으로 글로벌 캔버스 배경, 헤더, 내비게이션 탭, 히어로 통계 카드, 스타대학 명단/요약 카드, 전체 랭킹 테이블, 월별 아카이빙 뷰 전반의 색상 체계와 티어 뱃지를 라이트 모드 고대비 가독성 중심으로 전환합니다.

**Tech Stack:** Next.js 15 (App Router), React 18, Tailwind CSS, Lucide React, Vitest

---

### Task 1: Global Base & Layout Theme Transition

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update `src/app/globals.css` and `src/app/layout.tsx`**
  - Body background: `#f8fafc` (slate-50)
  - Text color: `#0f172a` (slate-900)
  - Scrollbar: light mode tracks (`#f1f5f9`) and thumbs (`#cbd5e1`)
- [ ] **Step 2: Update `src/app/page.tsx` canvas and section headers**
  - Main container: `bg-[#f8fafc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900`
  - Section dividers: `border-slate-200`
- [ ] **Step 3: Run smoke tests and build verification**
  - Command: `rtk npm test`
- [ ] **Step 4: Commit**
  - `git commit -m "style: set global layout and canvas background to light theme"`

---

### Task 2: Header, NavTabs & Tier Styles Adaptation

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/NavTabs.tsx`
- Modify: `src/lib/calculator.ts`

- [ ] **Step 1: Update `src/lib/calculator.ts` tier styles for light backgrounds**
  - 30만+: soft amber background `bg-amber-50 border-amber-200 text-amber-900`
  - 20만+: soft purple background `bg-purple-50 border-purple-200 text-purple-900`
  - 10만+: soft emerald background `bg-emerald-50 border-emerald-200 text-emerald-900`
- [ ] **Step 2: Update `src/components/Header.tsx`**
  - Background: `bg-white border-slate-200 shadow-sm`
  - Title: `#0f172a` (slate-900), subtitle: `text-slate-500`
  - Refresh button: `bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200`
- [ ] **Step 3: Update `src/components/NavTabs.tsx`**
  - Tab container: `bg-slate-200/80 border-slate-300/80`
  - Active tab: `bg-white text-emerald-700 shadow-sm border-slate-200`
  - Inactive tabs: `text-slate-600 hover:text-slate-900`
- [ ] **Step 4: Verify test suite**
  - Command: `rtk npm test`
- [ ] **Step 5: Commit**
  - `git commit -m "style: update Header, NavTabs and tier badge styles for light theme"`

---

### Task 3: HeroStats & CrewRankSummary Light Theme Styling

**Files:**
- Modify: `src/components/HeroStats.tsx`
- Modify: `src/components/CrewRankSummary.tsx`
- Modify: `src/components/CrewCrest.tsx`

- [ ] **Step 1: Update `src/components/HeroStats.tsx`**
  - 4 cards: `bg-white border-slate-200 shadow-xs hover:border-slate-300`
  - Labels: `text-slate-500`, Values: `text-slate-900`
  - Stat highlights: Emerald (`#059669`), Gold (`#d97706`), Sky (`#0284c7`)
- [ ] **Step 2: Update `src/components/CrewRankSummary.tsx`**
  - Container and crew cards: `bg-white border-slate-200 shadow-xs`
  - Race badges (T, Z, P): high-contrast light borders
- [ ] **Step 3: Update `src/components/CrewCrest.tsx` fallback badge border for light mode**
  - Emblem wrapper: `bg-slate-100 border-slate-200`
- [ ] **Step 4: Verify test suite**
  - Command: `rtk npm test`
- [ ] **Step 5: Commit**
  - `git commit -m "style: adapt HeroStats, CrewRankSummary and CrewCrest to light theme"`

---

### Task 4: CrewCard & RankView (Table & List) Light Theme Transformation

**Files:**
- Modify: `src/components/CrewCard.tsx`
- Modify: `src/components/RankView.tsx`

- [ ] **Step 1: Update `src/components/CrewCard.tsx`**
  - Crew card: `bg-white border-slate-200 shadow-xs`
  - Header: `border-b border-slate-100`
  - Member row: `hover:bg-slate-50 text-slate-800`
  - Metrics: gold stars (`text-amber-600`), green hourly (`text-emerald-600`)
- [ ] **Step 2: Update `src/components/RankView.tsx`**
  - Container: `bg-white border-slate-200 shadow-xs`
  - Search input: `bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white`
  - Table header: `bg-slate-50/80 border-slate-200 text-slate-600`
  - Row divider: `divide-slate-100`
  - Streamer nickname: `text-slate-900 group-hover:text-emerald-600`
  - College badge: `bg-slate-100 border-slate-200 text-slate-800`
  - Metrics: stars `text-amber-600`, hourly `text-emerald-600`, broadcast `text-slate-600`
- [ ] **Step 3: Run test suite**
  - Command: `rtk npm test`
- [ ] **Step 4: Commit**
  - `git commit -m "style: transform CrewCard and RankView to light theme"`

---

### Task 5: ArchiveView, Build, Deploy & Visual Verification

**Files:**
- Modify: `src/components/ArchiveView.tsx`

- [ ] **Step 1: Update `src/components/ArchiveView.tsx`**
  - Month selector, archive cards, calendar, and tables adapted to `bg-white border-slate-200`
- [ ] **Step 2: Run all tests**
  - Command: `rtk npm test`
- [ ] **Step 3: Production build**
  - Command: `rtk npm run build`
- [ ] **Step 4: Deploy to Cloudflare Pages**
  - Command: `npx wrangler pages deploy .vercel/output/static --project-name=soop-star-naksoopyo`
- [ ] **Step 5: Visual verification with Playwright screenshots**
  - Capture desktop & mobile screenshots of both main and rank tabs
- [ ] **Step 6: Push to `origin main`**
  - `git push origin main`
