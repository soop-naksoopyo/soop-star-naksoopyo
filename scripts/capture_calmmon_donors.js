const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 카드 내부의 표시 중인 모든 이미지(아바타 등)가 다운로드 완료(complete === true)될 때까지 대기
async function waitForVisibleImages(page, locator, minCount = 1, timeout = 12000) {
  try {
    const handle = await locator.elementHandle();
    await page.waitForFunction(
      ({ el, minCount }) => {
        const imgs = Array.from(el.querySelectorAll('img')).filter((i) => {
          const rect = i.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(i).display !== 'none';
        });
        if (imgs.length < minCount) return false;
        return imgs.every((i) => i.complete);
      },
      { el: handle, minCount },
      { timeout }
    );
  } catch (e) {
    console.log('⚠️ 일부 아바타 이미지 로드 타임아웃 (계속 진행)');
  }
}

async function captureCalmmonDonors() {
  const baseUrl = process.env.TARGET_URL || process.argv[2] || 'https://soop-star-naksoopyo.pages.dev';
  const targetUrl = baseUrl.endsWith('/calm') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/calm`;
  const outDir = process.env.OUTPUT_DIR || path.join(__dirname, '../public/captures/calm_donors');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`🚀 캄몬스타즈 후원 랭킹 TOP 100 캡처 시작: ${targetUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 1200 },
    deviceScaleFactor: 2
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    const cardLocator = page.locator('div.bg-white.rounded-2xl.shadow-sm.border.border-slate-200').first();
    await cardLocator.waitFor({ state: 'visible', timeout: 20000 });
    await cardLocator.scrollIntoViewIfNeeded();

    // 후원 랭킹 탭 선택
    console.log('👑 후원 랭킹 탭 선택...');
    const donorTabBtn = page.locator('button:has-text("후원 랭킹")').first();
    await donorTabBtn.waitFor({ state: 'visible', timeout: 10000 });
    await donorTabBtn.click();

    // 후원자 데이터 렌더링 대기: 빈 데이터 문구가 사라지고 5페이지 버튼이 나타날 때까지 대기
    console.log('⏳ 후원자 데이터 렌더링 대기 중...');
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      const hasEmptyMsg = text.includes('후원자 데이터가 없습니다.');
      const pageButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const hasPage5 = pageButtons.includes('5');
      return !hasEmptyMsg && hasPage5;
    }, { timeout: 25000 });
    console.log('✅ 후원자 데이터 렌더링 확인 완료!');

    const pages = [
      { pageNum: 1, filename: '01_donor_01_20.png', label: '1~20위' },
      { pageNum: 2, filename: '02_donor_21_40.png', label: '21~40위' },
      { pageNum: 3, filename: '03_donor_41_60.png', label: '41~60위' },
      { pageNum: 4, filename: '04_donor_61_80.png', label: '61~80위' },
      { pageNum: 5, filename: '05_donor_81_100.png', label: '81~100위' },
    ];

    for (const p of pages) {
      console.log(`📸 [${p.pageNum}/5] 후원 랭킹 ${p.label} (페이지 ${p.pageNum}) 캡처 중...`);
      // 해당 페이지 번호 버튼 클릭
      const pageBtn = page.locator(`button:text-is("${p.pageNum}")`).first();
      await pageBtn.waitFor({ state: 'visible', timeout: 10000 });
      await pageBtn.click();
      await waitForVisibleImages(page, cardLocator, 20, 15000);
      await page.waitForTimeout(300);

      const outPath = path.join(outDir, p.filename);
      await cardLocator.screenshot({ path: outPath });
      console.log(`✅ ${p.filename} 저장 완료!`);
    }

    console.log(`🎉 캄몬 후원 랭킹 1~100위 (5장) 캡처 전체 완료! 경로: ${outDir}`);
  } catch (err) {
    console.error('❌ 후원 랭킹 캡처 오류:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureCalmmonDonors();
