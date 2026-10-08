#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
와이고수(ygosu.com) 랜능크게시판 자동 로그인 및 글쓰기 스크립트 (Playwright)
- 별풍선 / 뷰어십 크루 랭킹 및 개인별 TOP 10 캡처 이미지 4장 자동 첨부
- 계정 자동 로그인 및 본문 작성, 파일 업로드 지원
"""

import os
import sys
import time
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

DEFAULT_BODY = """별풍선/뷰어십 스타크루 및 개인별 TOP 10 텍스트 요약

■ 1. 별풍선 스타크루 랭킹 (인당 평균풍 기준)
- 1위: 더블비 (14명 / 총 1,562,910개 / 인당 111,636개)
- 2위: 캄몬 (16명 / 총 1,177,061개 / 인당 73,566개)
- 3위: 케이대 (26명 / 총 1,301,679개 / 인당 52,067개)
- 4위: 뉴캣슬 (21명 / 총 1,078,298개 / 인당 51,348개)
- 5위: 극락회 (9명 / 총 381,994개 / 인당 47,749개)

■ 2. 별풍선 개인별 TOP 10
- 1위: 두디_♥ (더블비) 636,515개
- 2위: 박재혁;;; (더블비) 251,266개
- 3위: Fresh토마토 (캄몬) 202,567개
- 4위: 하블리♬ (JSA) 200,413개
- 5위: 나무늘봉순 (무소속) 158,108개
- 6위: Best도재욱 (뉴캣슬) 151,305개
- 7위: 태영♥ (무소속) 145,136개
- 8위: 또해영♥ (더블비) 136,137개
- 9위: 비재희 (와플대) 134,686개
- 10위: 비타밍♥ (캄몬) 129,378개

■ 3. 뷰어십 스타크루 랭킹 (인당 평균 뷰어십 기준)
- 1위: 캄몬 (16명 / 총 227,294 / 인당 14,206)
- 2위: 케이대 (25명 / 총 130,525 / 인당 5,439)
- 3위: 뉴캣슬 (20명 / 총 70,293 / 인당 3,515)
- 4위: 더블비 (13명 / 총 41,461 / 인당 3,189)
- 5위: JSA (20명 / 총 57,561 / 인당 2,878)

■ 4. 뷰어십 개인별 TOP 10
- 1위: Fresh토마토 (캄몬) 1,026명 / 63,544
- 2위: 강덕구 (무소속) 858명 / 37,066
- 3위: 낭니♥ (캄몬) 1,045명 / 36,767
- 4위: 지두두 (캄몬) 424명 / 31,906
- 5위: 으냉이 (무소속) 277명 / 24,459
- 6위: 앵지 (무소속) 463명 / 19,060
- 7위: 비타밍♥ (캄몬) 221명 / 18,387
- 8위: 슬돌이 (케이대) 315명 / 16,590
- 9위: 홍구 (JSA) 316명 / 16,337
- 10위: 태영♥ (무소속) 247명 / 16,071

※ 전체 순위표 및 상세 통계는 첨부된 이미지 4장을 확인해주세요!"""

def main():
    parser = argparse.ArgumentParser(description="와이고수 랜능크게시판 Playwright 글쓰기 도구")
    parser.add_argument("--id", default=os.environ.get("YGOSU_ID", "brainzerg77"), help="와이고수 아이디")
    parser.add_argument("--pw", default=os.environ.get("YGOSU_PW", "didgmlxo12!@"), help="와이고수 비밀번호")
    parser.add_argument("--board", default=os.environ.get("YGOSU_BOARD", "pan_random"), help="게시판 아이디 (기본값: pan_random)")
    parser.add_argument("--title", default=os.environ.get("POST_TITLE", "auto"), help="글 제목 ('auto' 시 현재 KST 시간 기반 자동 생성)")
    parser.add_argument("--content", default=os.environ.get("POST_CONTENT", ""), help="글 본문 (기본값: 내용 없음, 사진만 첨부)")
    parser.add_argument("--auto-submit", action="store_true", help="작성 후 자동으로 완료/등록 버튼 클릭")
    parser.add_argument("--headless", action="store_true", help="헤드리스 모드로 실행")

    args = parser.parse_args()

    # 자동 제목 생성 (auto 지정 시)
    if not args.title or args.title.strip() == "auto":
        from datetime import datetime, timezone, timedelta
        kst = timezone(timedelta(hours=9))
        now_kst = datetime.now(kst)
        args.title = f"[{now_kst.strftime('%m-%d %H시')}] 스타크루 별풍선 & 뷰어십 랭킹 / 개인 TOP10"

    # 첨부할 캡처 이미지 경로 (사용자 요청 순서: 별풍크루 -> 뷰어십크루 -> 별풍개인 -> 뷰어십개인)
    project_root = Path(__file__).resolve().parent.parent
    captures_dir = project_root / "public" / "captures"
    image_files = [
        captures_dir / "01_star_crew_ranking.png",          # 1. 별풍선 크루 순위
        captures_dir / "03_viewership_crew_ranking.png",     # 2. 뷰어십 크루 순위
        captures_dir / "02_star_individual_top10.png",      # 3. 별풍선 개인 top10
        captures_dir / "04_viewership_individual_top10.png", # 4. 뷰어십 개인 top10
    ]

    valid_images = [str(f.resolve()) for f in image_files if f.exists()]
    print(f"📦 첨부 이미지 4장 확인:\n" + "\n".join([f"  {i+1}. {Path(f).name}" for i, f in enumerate(valid_images)]))

    print("\n🚀 Playwright 브라우저를 시작합니다...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=args.headless,
            args=["--start-maximized"]
        )
        context = browser.new_context(
            viewport=None,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # 알림창(alert/confirm) 자동 수락
        page.on("dialog", lambda d: (print(f"🔔 알림창 감지: '{d.message}' -> 확인 클릭"), d.accept()))

        login_url = f"https://ygosu.com/login/?type=normal&backurl=%2Fboard%2F{args.board}%2F%3Fmode%3Dwrite"
        write_url = f"https://ygosu.com/board/{args.board}/?mode=write"

        print(f"🌐 로그인 페이지로 이동: {login_url}")
        page.goto(login_url, wait_until="domcontentloaded")

        # 1. 자동 로그인 시도
        if args.id and args.pw:
            print(f"🔑 계정({args.id})으로 로그인을 진행합니다...")
            page.wait_for_selector("#ygosu_login_id", timeout=10000)
            page.fill("#ygosu_login_id", args.id)
            page.fill("#ygosu_login_pwd", args.pw)
            page.press("#ygosu_login_pwd", "Enter")
            page.wait_for_timeout(2500)

        # 2. 글쓰기 페이지 이동
        print(f"📝 글쓰기 페이지({write_url})로 이동합니다...")
        page.goto(write_url, wait_until="domcontentloaded")
        page.wait_for_selector("#subject", timeout=15000)
        print("✅ 글쓰기 페이지 진입 성공!")

        # 임시저장 글 불러오기 모달이 뜬 경우 "취소" 클릭하여 닫기
        try:
            cancel_btn = page.locator(".yg-dialog-modal button:has-text('취소'), .yg-dialog-daisy button:has-text('취소')").first
            if cancel_btn.count() > 0 and cancel_btn.is_visible():
                print("🗑️ 임시 저장 글 불러오기 모달 감지 -> '취소' 클릭하여 닫음")
                cancel_btn.click()
                page.wait_for_timeout(1000)
        except Exception:
            pass

        # 3. 제목 입력
        print(f"✍️ 제목 입력: '{args.title}'")
        page.fill("#subject", args.title)

        # 4. 본문 입력 (Summernote) - 본문 내용이 있을 때만 입력, 없으면 빈 상태 유지
        if args.content and args.content.strip():
            print("📄 본문 내용 입력 중...")
            paragraphs = args.content.split("\n\n")
            html_content = "".join([f"<p>{p.replace(chr(10), '<br>')}</p>" for p in paragraphs if p.strip()])
            page.evaluate(f"""() => {{
                const el = document.querySelector('.note-editable');
                if (el) {{
                    el.innerHTML = {repr(html_content)};
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
                const textarea = document.querySelector('#ygosu_editor_');
                if (textarea) {{
                    textarea.value = {repr(html_content)};
                }}
            }}""")
            print("✅ 본문 내용 주입 완료!")
        else:
            print("📄 본문 내용 없음 (사진만 단독 게시)")
            page.evaluate("""() => {
                const el = document.querySelector('.note-editable');
                if (el) {
                    el.innerHTML = '<p><br></p>';
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const textarea = document.querySelector('#ygosu_editor_');
                if (textarea) {
                    textarea.value = '';
                }
            }""")

        # 5. 파일 첨부 (순서 보장을 위해 4장 순차 업로드)
        if valid_images:
            print("🖼️ 캡처 이미지 4장 순차 첨부 중...")
            file_input = page.locator("input[type='file'][onchange*='board_file_upload']").first
            if file_input.count() > 0:
                for idx, img_path in enumerate(valid_images):
                    file_name = Path(img_path).name
                    print(f"  [{idx+1}/{len(valid_images)}] 업로드 중: {file_name}")
                    file_input.set_input_files(img_path)
                    page.wait_for_function(
                        f"document.querySelectorAll('#upload_file_list li').length === {idx+1}",
                        timeout=15000
                    )
                    page.wait_for_timeout(600)
                
                # 업로드된 파일 목록 최종 확인
                uploaded_items = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('#upload_file_list li'))
                        .map(li => li.innerText.split('\\n')[0].trim());
                }""")
                print(f"✅ 파일 업로드 완료 (총 {len(uploaded_items)}개 등록됨): {uploaded_items}")
            else:
                print("⚠️ 파일 첨부 인풋을 찾지 못했습니다.")

        # 6. 등록 처리
        artifact_dir_env = os.environ.get("ARTIFACT_DIR")
        if artifact_dir_env and Path(artifact_dir_env).exists():
            artifact_dir = Path(artifact_dir_env)
        elif Path("/Users/ht/.gemini/antigravity/brain/834ccb19-7c92-413c-bf09-592095b382dc").exists():
            artifact_dir = Path("/Users/ht/.gemini/antigravity/brain/834ccb19-7c92-413c-bf09-592095b382dc")
        else:
            artifact_dir = None

        if artifact_dir:
            try:
                page.screenshot(path=str(artifact_dir / "ygosu_write_form_ready.png"))
            except Exception:
                pass

        if args.auto_submit:
            print("🚀 [완료] 등록 버튼을 클릭하여 게시글을 등록합니다...")
            # 남아있는 모달이 있다면 닫기
            try:
                page.evaluate("""() => {
                    document.querySelectorAll('.yg-dialog-modal button, .yg-dialog-daisy button').forEach(b => {
                        if (b.innerText.includes('취소') || b.innerText.includes('닫기')) b.click();
                    });
                }""")
                page.wait_for_timeout(500)
            except Exception:
                pass

            submit_btn = page.locator("a[onclick*='check_board_write']").first
            if submit_btn.count() > 0:
                try:
                    submit_btn.click(force=True, timeout=5000)
                except Exception:
                    page.evaluate("() => { const el = document.querySelector('a[onclick*=\"check_board_write\"]'); if (el) el.click(); }")
                print("⏳ 게시글 등록 중... 잠시 대기합니다.")
                try:
                    page.wait_for_url(lambda u: "/?mode=write" not in u, timeout=15000)
                except Exception:
                    page.wait_for_timeout(6000)
                print(f"🎉 게시글 등록 완료! 현재 URL: {page.url}")
                page.wait_for_timeout(2000)
                if artifact_dir:
                    try:
                        page.screenshot(path=str(artifact_dir / "ygosu_published_post.png"))
                    except Exception:
                        pass
            else:
                print("⚠️ 등록 버튼을 찾지 못했습니다.")
        else:
            print("\n" + "=" * 60)
            print("🎉 제목, 본문, 이미지 4장이 모두 입력되었습니다!")
            print(f"   제목: {args.title}")
            print(f"   본문: {args.content[:50]}...")
            print(f"   첨부: {len(valid_images)}장 완료")
            print("👉 브라우저에서 최종 확인 후 [완료] 버튼을 누르시면 됩니다.")
            print("   (터미널에서 Enter를 누르면 브라우저를 닫고 종료합니다)")
            print("=" * 60 + "\n")
            try:
                input("👉 확인 및 등록 후 [Enter]를 눌러 종료하세요: ")
            except KeyboardInterrupt:
                pass

        browser.close()
        print("👋 스크립트 실행이 종료되었습니다.")

if __name__ == "__main__":
    main()
