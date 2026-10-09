import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'src/data/calmmonMatches.json');

const CALMMON_MEMBERS = [
  { soopId: 'brainzerg7', nickname: '김윤환' },
  { soopId: 'minchul', nickname: '김민철' },
  { soopId: 'h78ert', nickname: '박준오' },
  { soopId: 'jmc06170', nickname: '왜냐맨' },
  { soopId: 'hoonykkk', nickname: '사테' },
  { soopId: 'goodzerg', nickname: '배성흠' },
  { soopId: 'freshtomato', nickname: '토마토' },
  { soopId: 'seemin88', nickname: '비타밍' },
  { soopId: 'wjswlgns09', nickname: '지두두' },
  { soopId: '2meonjin', nickname: '먼진' },
  { soopId: 'fpahsdltu1', nickname: '주하랑' },
  { soopId: 'sksmsskdsl10', nickname: '낭니' },
  { soopId: 'thelddl', nickname: '햇살' },
  { soopId: 'rnaqpdrjf', nickname: '남덕선' },
  { soopId: 'vldpfm2', nickname: '아리송이' },
  { soopId: 'dlaguswl501', nickname: '임조이' },
  { soopId: 'soju2022', nickname: '소주양' },
];

function getTargetMonth() {
  const arg = process.argv[2]?.slice(0, 7);
  if (arg && /^\d{4}-\d{2}$/.test(arg)) return arg;
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function syncEloboardMatches() {
  const targetMonth = getTargetMonth();
  console.log(`[Eloboard Sync] Starting sponsor matches sync for ${targetMonth}...`);

  const nameToCount = new Map();

  for (let p = 1; p <= 4; p++) {
    const url = `https://eloboard.com/ranking?month=${targetMonth}&page=${p}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const matches = [...html.matchAll(/ranking-module__T882VG__nm">([^<]+)<\/span>[\s\S]*?ranking-module__T882VG__num[^"]*">(\d+)</g)];
        for (const m of matches) {
          nameToCount.set(m[1].trim(), parseInt(m[2], 10));
        }
      }
    } catch (err) {
      console.warn(`[Eloboard Sync] Page ${p} fetch failed:`, err.message);
    }
  }

  console.log(`[Eloboard Sync] Scraped ${nameToCount.size} players from Eloboard.`);

  let rawData = {};
  if (fs.existsSync(jsonPath)) {
    try {
      rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.warn(`[Eloboard Sync] Could not parse existing json, creating new.`, e.message);
    }
  }

  if (!rawData[targetMonth]) {
    rawData[targetMonth] = {};
  }

  let updatedCount = 0;
  for (const m of CALMMON_MEMBERS) {
    const count = nameToCount.get(m.nickname) || 0;
    rawData[targetMonth][m.soopId.toLowerCase()] = count;
    updatedCount += count;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(rawData, null, 2) + '\n', 'utf8');
  console.log(`[Eloboard Sync] ✅ Successfully updated ${targetMonth} calmmon matches (Total: ${updatedCount} games).`);
}

syncEloboardMatches().catch((err) => {
  console.error('[Eloboard Sync] Fatal error:', err);
  process.exit(1);
});
