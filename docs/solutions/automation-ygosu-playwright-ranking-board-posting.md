---
title: Automate Ygosu Forum Posting with Playwright and Leaderboard Screen Captures
date: 2026-10-09
category: automation
module: scripts
problem_type: feature
component: playwright-automation
symptoms:
  - Manual screen capture, cropping, formatting, logging in, and uploading to Ygosu forum is slow and error-prone
  - Summernote rich text editor ignores direct value setting without updating .note-editable DOM and dispatching events
  - Ygosu file attachment requires targeting onchange board_file_upload input element
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
---

# Automate Ygosu Forum Posting with Playwright and Leaderboard Screen Captures

## Problem
Posting periodic StarCraft crew rankings and viewership statistics (4 distinct leaderboard views: Crew Balloon, Individual Balloon TOP 10, Crew Viewership, Individual Viewership TOP 10) to the Ygosu gaming forum (`ygosu.com/board/pan_random`) required repetitive manual steps:
1. High-resolution screenshot generation of each specific table/card container.
2. Logging in with credentials.
3. Navigating to the post creation page.
4. Inputting the title and structured summary text into Ygosu's custom Summernote rich text editor.
5. Uploading the 4 capture PNG files via Ygosu's asynchronous file upload handler.
6. Submitting the post.

## Root Cause & Technical Challenges
1. **Login Form Handling**: Ygosu does not use a standard HTML `<form>` submit for login; it uses `#ygosu_login_id` and `#ygosu_login_pwd` which post credentials asynchronously via `api.ygosu.com/v3/member-login/password` on `Enter` keypress or button click.
2. **Summernote Editor Integration**: Simply writing text to the hidden `#ygosu_editor_` `<textarea>` does not reflect in the active Summernote editor (`.note-editable`), and form submission validation checks both or triggers Summernote's sync routine. HTML paragraphs (`<p>...<br></p>`) must be inserted directly into `.note-editable` and input events dispatched.
3. **File Upload Ordering & Race Condition**: When passing multiple files simultaneously via `set_input_files([f1, f2, f3, f4])`, the browser and Ygosu server process each upload asynchronously in parallel. Smaller images finish earlier (e.g., 225KB image finished ahead of 552KB image), scrambling the presentation order. To guarantee exact ordering, files must be uploaded **sequentially** (`set_input_files(file_i)`) with explicit waiting on `document.querySelectorAll('#upload_file_list li').length === i + 1`.
4. **Post Submission**: Post registration triggers `YG_BOARD.check_board_write('BOARD_pan_random_0')` via `<a onclick="check_board_write...">`. If no body text is desired, Summernote can be left with empty content (`<p><br></p>`) while files remain attached.

## Solution
Implemented an automated Playwright workflow in `scripts/ygosu_post.py` and batch capture generation:

1. **High-DPI Retina Screen Captures**:
   - `scripts/capture_ygosu.ts` (or headless Playwright script) captured the 4 target containers at 2x device scale factor:
     - `public/captures/01_star_crew_ranking.png` (별풍 크루)
     - `public/captures/03_viewership_crew_ranking.png` (뷰어십 크루)
     - `public/captures/02_star_individual_top10.png` (별풍 개인 TOP10)
     - `public/captures/04_viewership_individual_top10.png` (뷰어십 개인 TOP10)
2. **Playwright Script (`scripts/ygosu_post.py`)**:
   - Accepts CLI arguments: `--id`, `--pw`, `--board`, `--title`, `--content`, `--auto-submit`, `--headless`.
   - Automates login with user-agent spoofing to avoid bot detection.
   - Converts formatted plain text into `<p>` / `<br>` blocks and writes to both `.note-editable` and `#ygosu_editor_` (or leaves empty when only images are requested).
   - Sequentially attaches each image waiting for `#upload_file_list` DOM length increment to prevent async upload race conditions and preserve exact sequence.
   - Supports preview mode (holding browser open until Enter is pressed) as well as `--auto-submit` for full hands-free publishing.

## Verification
- Executed `python3 scripts/ygosu_post.py --id brainzerg77 --pw ... --board pan_random --title "테스트" --auto-submit`.
- Successfully verified:
  - Login succeeded as user `나의_영웅_김윤환`.
  - 4 images uploaded and acknowledged by Ygosu server.
  - Post successfully published at `https://ygosu.com/board/pan_random` with title `테스트 [사진]`.
  - Board listing screenshot verified at `ygosu_published_post.png`.
