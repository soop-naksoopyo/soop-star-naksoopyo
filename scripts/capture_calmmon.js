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

async function captureCalmmon() {
  const baseUrl = process.env.TARGET_URL || process.argv[2] || 'https://soop-star-naksoopyo.pages.dev';
  const targetUrl = baseUrl.endsWith('/calm') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/calm`;
  const outDir = process.env.OUTPUT_DIR || path.join(__dirname, '../public/captures/calm');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`🚀 캄몬스타즈 Playwright 캡처 시작: ${targetUrl}`);
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
    // 카드 컨테이너 로딩 대기
    const cardLocator = page.locator('div.bg-white.rounded-2xl.shadow-sm.border.border-slate-200').first();
    await cardLocator.waitFor({ state: 'visible', timeout: 20000 });
    await cardLocator.scrollIntoViewIfNeeded();

    // 1. 별풍선 탭
    console.log('📸 [1/4] 별풍선 탭 캡처 중...');
    await page.click('button:has-text("별풍선")');
    await waitForVisibleImages(page, cardLocator, 10);
    await page.waitForTimeout(300);
    await cardLocator.screenshot({ path: path.join(outDir, '01_calm_star.png') });
    console.log('✅ 01_calm_star.png 저장 완료');

    // 2. 방송시간 탭
    console.log('📸 [2/4] 방송시간 탭 캡처 중...');
    await page.click('button:has-text("방송시간")');
    await waitForVisibleImages(page, cardLocator, 10);
    await page.waitForTimeout(300);
    await cardLocator.screenshot({ path: path.join(outDir, '02_calm_time.png') });
    console.log('✅ 02_calm_time.png 저장 완료');

    // 3. 스폰 판수 탭
    console.log('📸 [3/4] 스폰 판수 탭 캡처 중...');
    await page.click('button:has-text("스폰 판수")');
    await waitForVisibleImages(page, cardLocator, 10);
    await page.waitForTimeout(300);
    await cardLocator.screenshot({ path: path.join(outDir, '03_calm_spon.png') });
    console.log('✅ 03_calm_spon.png 저장 완료');

    // 4. 후원 랭킹 탭
    console.log('📸 [4/4] 후원 랭킹 탭 캡처 중...');
    const donorTabBtn = page.locator('button:has-text("후원 랭킹")').first();
    await donorTabBtn.waitFor({ state: 'visible', timeout: 10000 });
    await donorTabBtn.click();
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('후원자 데이터가 없습니다.');
    }, { timeout: 20000 }).catch(() => {});
    console.log('⏳ 후원자 아바타 이미지 로딩 대기...');
    await waitForVisibleImages(page, cardLocator, 20, 15000);
    await page.waitForTimeout(400);
    await cardLocator.screenshot({ path: path.join(outDir, '04_calm_donor.png') });
    console.log('✅ 04_calm_donor.png 저장 완료');

    console.log(`🎉 캄몬스타즈 4개 탭 캡처 전체 성공! 저장 경로: ${outDir}`);
  } catch (err) {
    console.error('❌ 캡처 중 오류 발생:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureCalmmon();
