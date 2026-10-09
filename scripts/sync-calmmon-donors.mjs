import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const donorsFilePath = path.join(root, 'src/data/calmmonDonors.json');

export const CALMMON_MEMBERS = [
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

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

function getDateRangeForMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const from = `${yearMonth}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export async function fetchMonthDonorsForCalmmon(yearMonth) {
  const { from, to } = getDateRangeForMonth(yearMonth);
  console.log(`[Donor Sync] Fetching exact ${yearMonth} donors (${from} ~ ${to})...`);

  const donorAgg = new Map();

  const NICK_TO_ID = new Map(CALMMON_MEMBERS.map((m) => [m.nickname, m.soopId]));

  for (const member of CALMMON_MEMBERS) {
    const url = `https://www.trackify.kr/api/v1/p/soop/streamer/${member.soopId}/donors?from=${from}&to=${to}&top=100`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
        },
      });
      if (!res.ok) {
        console.warn(`[Donor Sync] HTTP ${res.status} for ${member.nickname}`);
        continue;
      }
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];

      for (const item of items) {
        if (!item || !item.senderUserId) continue;
        const uid = item.senderUserId.toLowerCase();
        if (!donorAgg.has(uid)) {
          donorAgg.set(uid, {
            userId: item.senderUserId,
            userNick: item.senderUserNick || item.senderUserId,
            profileImage: `https://profile.img.sooplive.co.kr/LOGO/${item.senderUserId.slice(0, 2).toLowerCase()}/${item.senderUserId}/${item.senderUserId}.jpg`,
            balloonCount: 0,
            byStreamer: {},
          });
        }
        const record = donorAgg.get(uid);
        record.balloonCount += item.balloonCount || 0;
        record.byStreamer[member.nickname] = (record.byStreamer[member.nickname] || 0) + (item.balloonCount || 0);
        if (item.senderUserNick) {
          record.userNick = item.senderUserNick;
        }
      }
    } catch (err) {
      console.warn(`[Donor Sync] Error fetching ${member.nickname}:`, err.message);
    }
  }

  const list = Array.from(donorAgg.values()).map((d) => {
    const primary = Object.entries(d.byStreamer).sort((a, b) => b[1] - a[1])[0];
    const primaryNick = primary ? primary[0] : '캄몬';
    const primaryId = NICK_TO_ID.get(primaryNick);
    return {
      userId: d.userId,
      userNick: d.userNick,
      profileImage: d.profileImage,
      balloonCount: d.balloonCount,
      primaryStreamer: primaryNick,
      primaryStreamerId: primaryId,
    };
  });

  list.sort((a, b) => b.balloonCount - a.balloonCount);

  // TOP 200 donors
  const top200 = list.slice(0, 200).map((d, idx) => ({
    rank: idx + 1,
    ...d,
  }));

  console.log(`[Donor Sync] ${yearMonth} TOP 5 (Total ${top200.length} donors):`);
  top200.slice(0, 5).forEach((d) => {
    console.log(`  #${d.rank} ${d.userNick} (${d.userId}): ${d.balloonCount.toLocaleString()}개 (주후원: ${d.primaryStreamer})`);
  });

  return top200;
}

export async function syncCalmmonDonors(targetMonth = '2026-10') {
  let existingData = {};
  if (fs.existsSync(donorsFilePath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(donorsFilePath, 'utf8'));
    } catch {
      existingData = {};
    }
  }

  // 1. Target month sync
  const targetTop20 = await fetchMonthDonorsForCalmmon(targetMonth);
  if (targetTop20.length > 0) {
    existingData[targetMonth] = targetTop20;
  }

  // 2. 2026-09 historical sync if missing or empty
  if (!existingData['2026-09'] || existingData['2026-09'].length === 0) {
    const sepTop20 = await fetchMonthDonorsForCalmmon('2026-09');
    if (sepTop20.length > 0) {
      existingData['2026-09'] = sepTop20;
    }
  }

  fs.writeFileSync(donorsFilePath, JSON.stringify(existingData, null, 2), 'utf8');
  console.log(`[Donor Sync] Successfully saved calmmonDonors.json.`);
}

// CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argMonth = process.argv[2] || '2026-10';
  syncCalmmonDonors(argMonth)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
