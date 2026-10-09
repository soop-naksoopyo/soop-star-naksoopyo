const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const cardLocator = page.locator('div.bg-white.rounded-2xl.shadow-sm.border.border-slate-200').first();
    await cardLocator.waitFor({ state: 'visible', timeout: 20000 });
    await cardLocator.scrollIntoViewIfNeeded();

    // 후원 랭킹 탭 선택
    console.log('👑 후원 랭킹 탭 선택...');
    await page.click('button:has-text("후원 랭킹")');
    await page.waitForTimeout(600);

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
      if (await pageBtn.count() > 0) {
        await pageBtn.click();
        await page.waitForTimeout(500);
      }
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
