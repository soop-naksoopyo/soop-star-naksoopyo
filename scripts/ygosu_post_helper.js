const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const captureDir = path.join(__dirname, '../public/captures');
  const filesToUpload = [
    path.join(captureDir, '01_star_crew_ranking.png'),
    path.join(captureDir, '02_star_individual_top10.png'),
    path.join(captureDir, '03_viewership_crew_ranking.png'),
    path.join(captureDir, '04_viewership_individual_top10.png'),
  ];

  for (const f of filesToUpload) {
    if (!fs.existsSync(f)) {
      console.error(`Missing capture file: ${f}`);
      return;
    }
  }

  console.log('🚀 Playwright 브라우저를 실행합니다 (화면 표시 모드)...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log('🔑 와이고수 로그인 페이지로 이동합니다...');
  await page.goto('https://ygosu.com/login/?type=normal&backurl=%2Fboard%2Fpan_random%2F%3Fmode%3Dwrite', {
    waitUntil: 'domcontentloaded'
  });

  console.log('\n======================================================');
  console.log('📌 안내: 열린 브라우저 화면에서 직접 로그인을 진행해 주세요.');
  console.log('   (보안을 위해 비밀번호는 브라우저 창에 직접 입력하시면 됩니다)');
  console.log('======================================================\n');

  console.log('⏳ 로그인 후 글쓰기 페이지로의 이동을 대기 중입니다...');

  // 글쓰기 페이지 진입 대기 (최대 3분)
  try {
    await page.waitForURL('**/board/pan_random/?mode=write**', { timeout: 180000 });
    console.log('✅ 글쓰기 페이지 진입을 감지했습니다!');
  } catch (err) {
    console.log('⚠️ URL 대기 시간 초과 또는 다른 페이지로 이동됨. 현재 URL:', page.url());
    if (!page.url().includes('mode=write')) {
      console.log('글쓰기 페이지로 수동 이동합니다...');
      await page.goto('https://ygosu.com/board/pan_random/?mode=write', { waitUntil: 'domcontentloaded' });
    }
  }

  await page.waitForTimeout(2000);

  // 1. 제목 입력
  const defaultTitle = '[2026년 10월] 스타크루 별풍선 & 뷰어십 랭킹 / 개인별 TOP 10 통계';
  const titleSelector = 'input[name="subject"], input[name="title"], #subject, .write_subject input';
  try {
    const titleInput = page.locator(titleSelector).first();
    if (await titleInput.count() > 0) {
      await titleInput.fill(defaultTitle);
      console.log('✅ 제목 자동 입력 완료:', defaultTitle);
    }
  } catch (e) {
    console.log('제목 입력 필드 탐색 중 참고:', e.message);
  }

  // 2. 본문 작성
  const defaultContent = `2026년 10월 스타크루 통계 현황 공유합니다!

1. 별풍선 스타크루 랭킹 (인당 평균풍 기준)
 - 1위: 더블비 (14명 / 총 1,562,910개 / 인당 111,636개)
 - 2위: 캄몬 (16명 / 총 1,177,061개 / 인당 73,566개)
 - 3위: 케이대 (26명 / 총 1,301,679개 / 인당 52,067개)

2. 별풍선 개인별 TOP 10
 - 1위: 두디_♥ (더블비 / 636,515개)
 - 2위: 박재혁;;; (더블비 / 251,266개)
 - 3위: Fresh토마토 (캄몬 / 202,567개)
 - 4위: 하블리♬ (JSA / 200,413개)
 - 5위: 나무늘봉순 (무소속 / 158,108개)

3. 뷰어십 스타크루 랭킹 (인당 평균 뷰어십 기준)
 - 1위: 캄몬 (16명 / 총 227,294 / 인당 14,206)
 - 2위: 케이대 (25명 / 총 130,525 / 인당 5,439)
 - 3위: 뉴캣슬 (20명 / 총 70,293 / 인당 3,515)

4. 뷰어십 개인별 TOP 10
 - 1위: Fresh토마토 (캄몬 / 1,026명 / 63,544)
 - 2위: 강덕구 (무소속 / 858명 / 37,066)
 - 3위: 낭니♥ (캄몬 / 1,045명 / 36,767)
 - 4위: 지두두 (캄몬 / 424명 / 31,906)
 - 5위: 으냉이 (무소속 / 277명 / 24,459)

자세한 순위표는 첨부한 이미지 확인해주세요!`;

  // 본문 입력 시도 (textarea or contenteditable or iframe)
  try {
    const textarea = page.locator('textarea[name="content"], textarea#content, .write_content textarea').first();
    if (await textarea.count() > 0 && await textarea.isVisible()) {
      await textarea.fill(defaultContent);
      console.log('✅ 본문 텍스트 자동 입력 완료 (textarea)');
    } else {
      // 스마트 에디터 / iframe / contenteditable 탐색
      const editable = page.locator('div[contenteditable="true"], .note-editable, iframe').first();
      if (await editable.count() > 0) {
        if ((await editable.getAttribute('tagName'))?.toLowerCase() === 'iframe') {
          const frame = editable.contentFrame();
          if (frame) {
            await frame.locator('body').fill(defaultContent);
            console.log('✅ 본문 텍스트 자동 입력 완료 (iframe)');
          }
        } else {
          await editable.fill(defaultContent);
          console.log('✅ 본문 텍스트 자동 입력 완료 (contenteditable)');
        }
      }
    }
  } catch (e) {
    console.log('본문 입력 필드 탐색 중 참고:', e.message);
  }

  // 3. 파일 첨부 시도
  try {
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    if (count > 0) {
      console.log(`📎 파일 업로드 인풋 발견 (${count}개), 4개 캡처 이미지 첨부 시도...`);
      // 단일 다중 업로드 인풋인지, 개별 인풋인지 확인
      const firstInput = fileInputs.first();
      const isMultiple = await firstInput.getAttribute('multiple');
      if (isMultiple !== null) {
        await firstInput.setInputFiles(filesToUpload);
        console.log('✅ 다중 파일 업로드 완료');
      } else {
        // 개별 인풋 매핑
        for (let i = 0; i < Math.min(count, filesToUpload.length); i++) {
          await fileInputs.nth(i).setInputFiles(filesToUpload[i]);
          console.log(`✅ 파일 ${i + 1} 업로드 완료: ${path.basename(filesToUpload[i])}`);
        }
      }
    } else {
      console.log('ℹ️ 일반 input[type="file"] 대신 드래그앤드롭/전용 업로더 사용 중일 수 있습니다.');
    }
  } catch (e) {
    console.log('파일 첨부 시도 중 참고:', e.message);
  }

  console.log('\n======================================================');
  console.log('🎉 글 작성 폼에 제목/내용/파일 준비가 완료되었습니다!');
  console.log('   열려 있는 브라우저에서 최종 확인 후 [등록] 버튼을 눌러주세요.');
  console.log('======================================================\n');
}

main().catch(err => console.error('실행 중 오류 발생:', err));
