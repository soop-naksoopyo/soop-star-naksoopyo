const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureAll() {
  const targetUrl = process.env.TARGET_URL || process.argv[2] || 'https://soop-star-naksoopyo.pages.dev';
  const outDir = process.env.OUTPUT_DIR || path.join(__dirname, '../public/captures');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`🚀 Playwright 캡처 시작: ${targetUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 1200 },
    deviceScaleFactor: 2
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[id^="crew-card-"]', { timeout: 20000 });

    // 1. 별풍선 스타크루 랭킹 (하단 멤버 리스트 제외, 순위 요약 카드 및 표만 캡처)
    console.log('📸 [1/4] 별풍선 스타크루 랭킹 캡처 중...');
    const starCrewRank = page.locator('h2:has-text("스타크루 랭킹")').locator('xpath=ancestor::section[1]');
    await starCrewRank.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await starCrewRank.screenshot({ path: path.join(outDir, '01_star_crew_ranking.png') });
    console.log('✅ 01_star_crew_ranking.png 저장 완료');

    // 2. 뷰어십 스타크루 랭킹 (하단 크루 명단 대학별 리스트 제외, 순위 요약 카드 및 표만 캡처)
    console.log('📸 [2/4] 뷰어십 스타크루 랭킹 캡처 중...');
    await page.locator('button:has-text("뷰어십")').first().click();
    await page.waitForSelector('text=월간 뷰어십 순위', { timeout: 15000 });
    const crewModeBtn = page.locator('button:has-text("크루별")').first();
    if (await crewModeBtn.count() > 0) await crewModeBtn.click();
    await page.waitForTimeout(500);

    const viewershipCrewRank = page.locator('h2:has-text("스타크루 뷰어십 랭킹")').locator('xpath=ancestor::section[1]');
    await viewershipCrewRank.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await viewershipCrewRank.screenshot({ path: path.join(outDir, '03_viewership_crew_ranking.png') });
    console.log('✅ 03_viewership_crew_ranking.png 저장 완료');

    // 3. 별풍선 개인별 TOP 10
    console.log('📸 [3/4] 별풍선 개인별 TOP 10 캡처 중...');
    await page.locator('button:has-text("별풍선")').first().click();
    await page.waitForSelector('text=스타크루 랭킹', { timeout: 15000 });
    await page.locator('button:has-text("개인별")').first().click();
    await page.waitForSelector('text=전체 스트리머 별풍선 랭킹', { timeout: 15000 });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const container = document.querySelector('div.divide-y.divide-slate-200');
      if (container) {
        const rows = Array.from(container.children);
        rows.forEach((row, i) => {
          if (i >= 10) row.style.display = 'none';
        });
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(p => {
        if (p.textContent.includes('이전') || p.textContent.includes('다음')) {
          const parent = p.closest('div');
          if (parent) parent.style.display = 'none';
        }
      });
    });

    const starIndivSection = page.locator('div:has-text("전체 스트리머 별풍선 랭킹")')
      .locator('xpath=ancestor::div[contains(@class, "bg-white") and contains(@class, "rounded-xl")]')
      .first();
    await starIndivSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await starIndivSection.screenshot({ path: path.join(outDir, '02_star_individual_top10.png') });
    console.log('✅ 02_star_individual_top10.png 저장 완료');

    // 4. 뷰어십 개인별 TOP 10
    console.log('📸 [4/4] 뷰어십 개인별 TOP 10 캡처 중...');
    await page.locator('button:has-text("뷰어십")').first().click();
    await page.waitForSelector('text=월간 뷰어십 순위', { timeout: 15000 });
    await page.locator('button:has-text("개인별")').first().click();
    await page.waitForSelector('text=전체 스트리머 뷰어십 랭킹', { timeout: 15000 });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const card = document.querySelector('div.w-full.rounded-xl.border-2');
      if (card) {
        const rows = Array.from(card.querySelectorAll('div.grid.items-center.border-b'));
        rows.forEach((row, i) => {
          if (i >= 10) row.style.display = 'none';
        });
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(p => {
        if (p.textContent.includes('이전') || p.textContent.includes('다음')) {
          const parent = p.closest('div');
          if (parent) parent.style.display = 'none';
        }
      });
    });

    const viewershipIndivSection = page.locator('div:has-text("전체 스트리머 뷰어십 랭킹")')
      .locator('xpath=ancestor::div[contains(@class, "bg-white") and contains(@class, "rounded-xl")]')
      .first();
    await viewershipIndivSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await viewershipIndivSection.screenshot({ path: path.join(outDir, '04_viewership_individual_top10.png') });
    console.log('✅ 04_viewership_individual_top10.png 저장 완료');

    console.log('🎉 4개 캡처 이미지 생성 완료!');
  } finally {
    await browser.close();
  }
}

captureAll().catch(err => {
  console.error('❌ 캡처 실행 중 오류 발생:', err);
  process.exit(1);
});
