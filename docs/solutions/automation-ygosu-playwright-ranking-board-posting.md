---
title: Automate Ygosu Forum Posting with Playwright and Leaderboard Screen Captures
date: 2026-10-09
last_updated: 2026-10-09
category: automation
module: scripts
problem_type: feature
component: playwright-automation
symptoms:
  - Manual screen capture, cropping, formatting, logging in, and uploading to Ygosu forum is slow and error-prone
  - Summernote rich text editor ignores direct value setting without updating .note-editable DOM and dispatching events
  - Ygosu file attachment requires targeting onchange board_file_upload input element
  - Consecutive posting across multiple boards causes anti-flood blocks without an explicit cooldown
root_cause: manual_overhead
resolution_type: feature_implementation
severity: minor
tags:
  - playwright
  - ygosu
  - automation
  - web-scraping
  - summernote
  - multi-file-upload
  - github-actions
  - multi-board
---

# Automate Ygosu Forum Posting with Playwright and Leaderboard Screen Captures

## Problem
Posting periodic StarCraft crew rankings and viewership statistics (4 distinct leaderboard views: Crew Balloon, Individual Balloon TOP 10, Crew Viewership, Individual Viewership TOP 10) to Ygosu gaming forum boards (`pan_prison` 스타감옥, `starbbs` 스타방송, `pan_random` 랜능크) required repetitive manual steps:
1. High-resolution screenshot generation of each specific table/card container.
2. Logging in with credentials.
3. Navigating to the post creation page across multiple target boards.
4. Inputting the title and structured summary text into Ygosu's custom Summernote rich text editor.
5. Uploading the 4 capture PNG files via Ygosu's asynchronous file upload handler.
6. Submitting the post while preventing community anti-flood limits.

## Root Cause & Technical Challenges
1. **Login Form Handling**: Ygosu does not use a standard HTML `<form>` submit for login; it uses `#ygosu_login_id` and `#ygosu_login_pwd` which post credentials asynchronously via `api.ygosu.com/v3/member-login/password` on `Enter` keypress or button click.
2. **Summernote Editor Integration**: Simply writing text to the hidden `#ygosu_editor_` `<textarea>` does not reflect in the active Summernote editor (`.note-editable`), and form submission validation checks both or triggers Summernote's sync routine. HTML paragraphs (`<p>...<br></p>`) must be inserted directly into `.note-editable` and input events dispatched.
3. **File Upload Ordering & Race Condition**: When passing multiple files simultaneously via `set_input_files([f1, f2, f3, f4])`, the browser and Ygosu server process each upload asynchronously in parallel. Smaller images finish earlier (e.g., 225KB image finished ahead of 552KB image), scrambling the presentation order. To guarantee exact ordering, files must be uploaded **sequentially** (`set_input_files(file_i)`) with explicit waiting on `document.querySelectorAll('#upload_file_list li').length === i + 1`.
4. **Draft Restore & Modal Interception**: Ygosu renders custom DaisyUI modals (`.yg-dialog-modal`) when previous drafts exist. The modal backdrop intercepts pointer clicks to the submit button. Solved by dismissing drafts on page load and using `force=True` / JS fallback on submission.
5. **Precise Section Capture**: In `ViewershipView`, an outer `<section>` encapsulates both `CrewRankSummary` and the lengthy `CrewView` (university member cards). Generic `section:has-text("스타크루 뷰어십 랭킹")` captured the entire outer container. Solved by targeting `h2:has-text("스타크루 뷰어십 랭킹")` with `xpath=ancestor::section[1]` to isolate the podium and 2-column rank table.
6. **Multi-Board Publishing & Anti-Flood Cooldown**: Consecutive submissions with the same account across multiple boards trigger Ygosu's rate limit. Solved by parsing comma-delimited board targets (`pan_prison,starbbs`), maintaining the authenticated Playwright context, and inserting a 25-second cooldown delay (`page.wait_for_timeout(25000)`) between board submissions.

## Solution
Implemented an automated Playwright workflow in `scripts/ygosu_post.py`, capture script `scripts/capture_leaderboards.js`, and GitHub Actions workflow `.github/workflows/ygosu-ranking-post.yml`:

1. **High-DPI Retina Screen Captures (`scripts/capture_leaderboards.js`)**:
   - Captures the 4 target containers at 2x device scale factor against live site (`https://soop-star-naksoopyo.pages.dev`):
     - `01_star_crew_ranking.png` (별풍 크루 요약)
     - `03_viewership_crew_ranking.png` (뷰어십 크루 요약 - 하단 대학별 명단 제외)
     - `02_star_individual_top10.png` (별풍 개인 TOP10)
     - `04_viewership_individual_top10.png` (뷰어십 개인 TOP10)
2. **Multi-Board Playwright Script (`scripts/ygosu_post.py`)**:
   - Accepts CLI arguments or environment variables (`YGOSU_ID`, `YGOSU_PW`, `YGOSU_BOARD`, `POST_TITLE`).
   - Default board targets: `pan_prison,starbbs`.
   - Dynamic KST title generation: `[MM/DD HH시 기준] 스타크루 별풍선 & 뷰어십 랭킹 / 개인 TOP 10`.
   - Automates login with user-agent spoofing to avoid bot detection.
   - Sequentially attaches each image waiting for `#upload_file_list` DOM length increment.
   - Applies 25s flood protection cooldown between consecutive boards.
3. **GitHub Actions 3-Hour Automation (`.github/workflows/ygosu-ranking-post.yml`)**:
   - Triggers on `cron: '0 */3 * * *'` (every 3 hours) and `workflow_dispatch` (manual run).
   - Reads secrets (`YGOSU_ID`, `YGOSU_PW`) securely.

## Verification
- GitHub Actions run `#37813717650` executed end-to-end on Ubuntu runner in 2m 06s.
- 4 screenshots captured cleanly and uploaded sequentially.
- Published to Ygosu:
  - `pan_prison` (스타감옥): `https://ygosu.com/board/pan_prison/36102`
  - `starbbs` (스타방송): `https://ygosu.com/board/starbbs/18058624`
- Visual appearance confirmed via screenshot artifacts:
  - `pan_prison_board_verified.png` & `starbbs_board_verified.png` (게시판 목록 최신글 확인)
  - `pan_prison_post_detail.png` & `starbbs_post_detail.png` (4개 랭킹 이미지 순서 및 레이아웃 정상 표시)
