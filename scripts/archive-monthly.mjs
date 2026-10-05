import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. 대상 월 결정 (인자 > 환경변수 > KST 기준 전월)
function getTargetMonth() {
  const arg = process.argv[2];
  if (arg && /^\d{4}-\d{2}$/.test(arg)) {
    return arg;
  }
  if (process.env.TARGET_MONTH && /^\d{4}-\d{2}$/.test(process.env.TARGET_MONTH)) {
    return process.env.TARGET_MONTH;
  }
  // KST (UTC+9) 기준 전월 계산
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const prevMonthDate = new Date(Date.UTC(kstTime.getUTCFullYear(), kstTime.getUTCMonth() - 1, 1));
  const yyyy = prevMonthDate.getUTCFullYear();
  const mm = String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

// 2. 크루 데이터 가져오기 (실시간 API 우선, 실패 시 starCrewsData 파일 파싱)
async function fetchCrewData(targetMonth) {
  const url = new URL('https://soop-star-naksoopyo.pages.dev/api/stats');
  url.searchParams.set('month', targetMonth);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GitHubActions-MonthlyArchive' }
  });
  if (!res.ok) {
    throw new Error(`Could not load ${targetMonth} snapshots (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.success || !Array.isArray(json.starCrews) || json.starCrews.length === 0) {
    throw new Error(`No complete ${targetMonth} snapshot is available to archive`);
  }
  console.log(`[Archive] ✅ Loaded ${json.starCrews.length} crews from ${targetMonth} snapshots.`);
  return json.starCrews;
}

// 3. 랭킹 및 통계 산출
function computeArchiveSnapshot(targetMonth, crews) {
  const ranked = crews.map((c) => {
    const memberCount = c.members.length;
    const totalStars = c.members.reduce((sum, m) => sum + (m.totalStars || 0), 0);
    const starReceivingMemberCount = c.members.filter((member) => member.totalStars > 0).length;
    const avgStars = starReceivingMemberCount > 0 ? Math.round(totalStars / starReceivingMemberCount) : 0;
    return {
      rank: 0,
      crewName: c.crewName,
      memberCount,
      totalStars,
      avgStars,
    };
  })
  .sort((a, b) => b.avgStars - a.avgStars || b.totalStars - a.totalStars)
  .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const totalStars = ranked.reduce((sum, r) => sum + r.totalStars, 0);
  const totalMembers = ranked.reduce((sum, r) => sum + r.memberCount, 0);
  const topCrew = [...ranked].sort((a, b) => b.totalStars - a.totalStars)[0];
  const topProductive = ranked[0];

  const [yearStr, monthStr] = targetMonth.split('-');
  const label = `${yearStr}년 ${parseInt(monthStr, 10)}월`;

  // 해당 월의 마지막 날짜 계산
  const lastDay = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const closedAt = `${targetMonth}-${String(lastDay).padStart(2, '0')} 23:59:59 마감 확정`;

  return {
    yearMonth: targetMonth,
    label,
    isClosed: true,
    closedAt,
    summary: {
      totalStars,
      totalMembers,
      topCrew: topCrew?.crewName || '더블비',
      topCrewStars: topCrew?.totalStars || 0,
      topProductiveCrew: topProductive?.crewName || '더블비',
      topProductiveStars: topProductive?.avgStars || 0,
    },
    ranks: ranked,
  };
}

// 4. src/data/archiveData.ts 파일에 저장
function saveToArchiveDataTs(newArchive) {
  const archivePath = path.join(rootDir, 'src/data/archiveData.ts');
  let content = fs.readFileSync(archivePath, 'utf-8');

  // ARCHIVE_MONTHS 객체 파싱
  const regex = /export const ARCHIVE_MONTHS:\s*Record<string,\s*MonthlyArchiveData>\s*=\s*(\{[\s\S]*?\n\};)/;
  const match = content.match(regex);
  if (!match) {
    throw new Error('Failed to find ARCHIVE_MONTHS in src/data/archiveData.ts');
  }

  // 기존 ARCHIVE_MONTHS 블록 평가를 위한 임시 함수 변환
  const existingBlock = match[1];
  let archiveMonths = {};
  try {
    const fn = new Function(`return ${existingBlock.replace(/;\s*$/, '')};`);
    archiveMonths = fn();
  } catch (e) {
    console.warn('[Archive] Could not evaluate existing archive data, appending directly.', e.message);
  }

  archiveMonths[newArchive.yearMonth] = newArchive;

  // 정렬된 키 순서로 다시 JSON 포맷팅
  const sortedKeys = Object.keys(archiveMonths).sort();
  const formattedObj = {};
  for (const k of sortedKeys) {
    formattedObj[k] = archiveMonths[k];
  }

  const newBlockStr = JSON.stringify(formattedObj, null, 2) + ';';
  const updatedContent = content.replace(regex, `export const ARCHIVE_MONTHS: Record<string, MonthlyArchiveData> = ${newBlockStr}`);

  fs.writeFileSync(archivePath, updatedContent, 'utf-8');
  console.log(`[Archive] ✅ Successfully wrote ${newArchive.yearMonth} archive snapshot into src/data/archiveData.ts`);
}

// 5. Supabase가 설정되어 있는 경우 DB에도 스냅샷 저장
async function saveToSupabaseIfConfigured(archive) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('[Archive] ℹ️ SUPABASE_URL not configured. Skipping DB table sync.');
    return;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // monthly_crew_archives 테이블에 업서트 시도
    const records = archive.ranks.map((r) => ({
      year_month: archive.yearMonth,
      rank: r.rank,
      crew_name: r.crewName,
      member_count: r.memberCount,
      total_stars: r.totalStars,
      avg_stars: r.avgStars,
      closed_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('monthly_crew_archives')
      .upsert(records, { onConflict: 'year_month,crew_name' });

    if (error) {
      console.warn('[Archive] Supabase upsert note:', error.message);
    } else {
      console.log(`[Archive] ✅ Successfully synced ${records.length} records to Supabase monthly_crew_archives!`);
    }
  } catch (err) {
    console.warn('[Archive] Supabase sync error:', err.message);
  }
}

async function main() {
  const targetMonth = getTargetMonth();
  console.log(`\n========================================`);
  console.log(`🚀 Starting Monthly Archive for: ${targetMonth}`);
  console.log(`========================================\n`);

  const crews = await fetchCrewData(targetMonth);
  const snapshot = computeArchiveSnapshot(targetMonth, crews);

  console.log(`[Summary] 1위 크루: ${snapshot.summary.topCrew} (${snapshot.summary.topCrewStars.toLocaleString()}개)`);
  console.log(`[Summary] 최고 화력(1인당): ${snapshot.summary.topProductiveCrew} (${snapshot.summary.topProductiveStars.toLocaleString()}개)`);
  console.log(`[Summary] 전체 누적: ${snapshot.summary.totalStars.toLocaleString()}개 (${snapshot.summary.totalMembers}명)\n`);

  saveToArchiveDataTs(snapshot);
  await saveToSupabaseIfConfigured(snapshot);

  console.log(`\n🎉 Monthly Archive for ${targetMonth} Completed Successfully!\n`);
}

main().catch((err) => {
  console.error('[Archive Error]', err);
  process.exit(1);
});
