export type Gender = 'male' | 'female';
export type CalmmonTabType = 'star' | 'time' | 'spon' | 'donor';

export interface CalmmonMemberMeta {
  soopId: string;
  nickname: string;
  gender: Gender;
  isBoss?: boolean;
}

export const CALMMON_MEMBERS: CalmmonMemberMeta[] = [
  // 남자 (6명)
  { soopId: 'brainzerg7', nickname: '김윤환', gender: 'male', isBoss: true },
  { soopId: 'minchul', nickname: '김민철', gender: 'male' },
  { soopId: 'h78ert', nickname: '박준오', gender: 'male' },
  { soopId: 'jmc06170', nickname: '왜냐맨', gender: 'male' },
  { soopId: 'hoonykkk', nickname: '사테', gender: 'male' },
  { soopId: 'goodzerg', nickname: '배성흠', gender: 'male' },
  // 여자 (11명)
  { soopId: 'freshtomato', nickname: '토마토', gender: 'female' },
  { soopId: 'seemin88', nickname: '비타밍', gender: 'female' },
  { soopId: 'wjswlgns09', nickname: '지두두', gender: 'female' },
  { soopId: '2meonjin', nickname: '먼진', gender: 'female' },
  { soopId: 'fpahsdltu1', nickname: '주하랑', gender: 'female' },
  { soopId: 'sksmsskdsl10', nickname: '낭니', gender: 'female' },
  { soopId: 'thelddl', nickname: '햇살', gender: 'female' },
  { soopId: 'rnaqpdrjf', nickname: '남덕선', gender: 'female' },
  { soopId: 'vldpfm2', nickname: '아리송이', gender: 'female' },
  { soopId: 'dlaguswl501', nickname: '임조이', gender: 'female' },
  { soopId: 'soju2022', nickname: '소주양', gender: 'female' },
];

// 캄몬스타즈 17명 전체 생일 매핑 ("MM-DD" 포맷)
export const CALMMON_BIRTHDAYS: Record<string, string> = {
  // 남자 (6명)
  brainzerg7: '06-13',  // 김윤환 (6월 13일)
  minchul: '12-10',     // 김민철 (12월 10일)
  h78ert: '06-24',      // 박준오 (6월 24일)
  jmc06170: '06-17',    // 왜냐맨 (6월 17일)
  hoonykkk: '07-16',    // 사테 (7월 16일)
  goodzerg: '08-17',    // 배성흠 (8월 17일)
  // 여자 (11명)
  freshtomato: '08-05', // 토마토 (8월 5일)
  seemin88: '01-20',    // 비타밍 (1월 20일)
  wjswlgns09: '09-01',  // 지두두 (9월 1일)
  '2meonjin': '12-01',  // 먼진 (12월 1일)
  fpahsdltu1: '10-15',  // 주하랑 (10월 15일 - 10월 🎂)
  sksmsskdsl10: '08-11',// 낭니 (8월 11일)
  thelddl: '11-21',     // 햇살 (11월 21일)
  rnaqpdrjf: '02-27',   // 남덕선 (2월 27일)
  vldpfm2: '01-02',     // 아리송이 (1월 2일)
  dlaguswl501: '11-11', // 임조이 (11월 11일)
  soju2022: '02-22',    // 소주양 (2월 22일)
};

/**
 * 특정 멤버의 생일 월이 현재 조회 중인 월(yearMonth: 'YYYY-MM')과 일치하는지 여부
 */
export function isBirthdayMonth(soopId: string, yearMonth: string): boolean {
  const bday = CALMMON_BIRTHDAYS[soopId.toLowerCase()];
  if (!bday || !yearMonth) return false;
  const month = yearMonth.slice(5, 7); // '2026-10' -> '10'
  const birthMonth = bday.slice(0, 2); // '10-15' -> '10'
  return month === birthMonth;
}

export interface CalmmonMemberRow {
  soopId: string;
  nickname: string;
  gender: Gender;
  isBoss?: boolean;
  isBirthday: boolean;
  isLive?: boolean;
  rawVal: number;
  displayVal: string;
  tierBadge?: 'top1' | 'top5' | 'top10' | 'boss';
}

export interface CalmmonStatsResult {
  male: CalmmonMemberRow[];
  female: CalmmonMemberRow[];
  totalSum: number;
  totalSumStr: string;
  femaleAvg: number;
  femaleAvgStr: string;
  totalAvg: number;
  totalAvgStr: string;
}

export interface StreamerStatInput {
  totalStars?: number;
  broadcastHours?: number;
  averageViewers?: number;
  isLive?: boolean;
  matchCount?: number;
}

// 2026년 9월 마감 확정 통계 (별풍선, 방송시간, Eloboard 스폰 판수)
export const CALMMON_SEPTEMBER_STATS: Record<string, StreamerStatInput> = {
  brainzerg7: { totalStars: 289027, broadcastHours: 93.9, averageViewers: 7580, matchCount: 4 },
  minchul: { totalStars: 194572, broadcastHours: 110.0, averageViewers: 532, matchCount: 80 },
  h78ert: { totalStars: 47977, broadcastHours: 113.2, averageViewers: 92, matchCount: 4 },
  jmc06170: { totalStars: 11600, broadcastHours: 66.4, averageViewers: 46, matchCount: 0 },
  hoonykkk: { totalStars: 92455, broadcastHours: 214.5, averageViewers: 37, matchCount: 0 },
  goodzerg: { totalStars: 28231, broadcastHours: 133.8, averageViewers: 34, matchCount: 2 },
  freshtomato: { totalStars: 454717, broadcastHours: 124.5, averageViewers: 1718, matchCount: 9 },
  seemin88: { totalStars: 384597, broadcastHours: 272.2, averageViewers: 226, matchCount: 21 },
  wjswlgns09: { totalStars: 575856, broadcastHours: 172.5, averageViewers: 633, matchCount: 3 },
  '2meonjin': { totalStars: 297051, broadcastHours: 143.5, averageViewers: 247, matchCount: 32 },
  fpahsdltu1: { totalStars: 283927, broadcastHours: 129.8, averageViewers: 349, matchCount: 17 },
  sksmsskdsl10: { totalStars: 408627, broadcastHours: 131.5, averageViewers: 396, matchCount: 22 },
  thelddl: { totalStars: 99543, broadcastHours: 135.3, averageViewers: 118, matchCount: 0 },
  rnaqpdrjf: { totalStars: 168635, broadcastHours: 119.5, averageViewers: 190, matchCount: 6 },
  vldpfm2: { totalStars: 100901, broadcastHours: 121.1, averageViewers: 107, matchCount: 7 },
  dlaguswl501: { totalStars: 114025, broadcastHours: 103.6, averageViewers: 405, matchCount: 6 },
  soju2022: { totalStars: 132198, broadcastHours: 143.6, averageViewers: 124, matchCount: 32 },
};

// 2026년 10월 기본 통계 (별풍선, 방송시간, Eloboard 스폰 판수 기본값)
export const CALMMON_DEFAULT_STATS: Record<string, StreamerStatInput> = {
  brainzerg7: { totalStars: 94012, broadcastHours: 41.9, averageViewers: 4819, matchCount: 1 },
  minchul: { totalStars: 63299, broadcastHours: 24.8, averageViewers: 459, matchCount: 17 },
  h78ert: { totalStars: 57926, broadcastHours: 65.1, averageViewers: 48, matchCount: 5 },
  jmc06170: { totalStars: 53290, broadcastHours: 57.9, averageViewers: 36, matchCount: 0 },
  hoonykkk: { totalStars: 33009, broadcastHours: 64.6, averageViewers: 24, matchCount: 0 },
  goodzerg: { totalStars: 4332, broadcastHours: 38.5, averageViewers: 28, matchCount: 1 },
  freshtomato: { totalStars: 223750, broadcastHours: 68.5, averageViewers: 1008, matchCount: 16 },
  seemin88: { totalStars: 143378, broadcastHours: 93.3, averageViewers: 208, matchCount: 24 },
  wjswlgns09: { totalStars: 131594, broadcastHours: 85.2, averageViewers: 402, matchCount: 8 },
  '2meonjin': { totalStars: 94812, broadcastHours: 59.8, averageViewers: 164, matchCount: 18 },
  sksmsskdsl10: { totalStars: 90585, broadcastHours: 41.0, averageViewers: 921, matchCount: 15 },
  fpahsdltu1: { totalStars: 88913, broadcastHours: 63.2, averageViewers: 223, matchCount: 16 },
  thelddl: { totalStars: 80508, broadcastHours: 71.0, averageViewers: 72, matchCount: 4 },
  dlaguswl501: { totalStars: 68647, broadcastHours: 61.3, averageViewers: 280, matchCount: 32 },
  vldpfm2: { totalStars: 62488, broadcastHours: 64.0, averageViewers: 50, matchCount: 7 },
  rnaqpdrjf: { totalStars: 58471, broadcastHours: 67.8, averageViewers: 122, matchCount: 5 },
  soju2022: { totalStars: 54378, broadcastHours: 63.3, averageViewers: 88, matchCount: 11 },
};

export function calculateCalmmonStats(
  statsMap: Map<string, StreamerStatInput>,
  tab: CalmmonTabType,
  yearMonth: string
): CalmmonStatsResult {
  const defaultFallback = yearMonth === '2026-09' ? CALMMON_SEPTEMBER_STATS : CALMMON_DEFAULT_STATS;

  const rows: CalmmonMemberRow[] = CALMMON_MEMBERS.map((m) => {
    const key = m.soopId.toLowerCase();
    const s = statsMap.get(key) || defaultFallback[key];
    let rawVal = 0;
    let displayVal = '0';

    if (tab === 'star') {
      rawVal = s?.totalStars || 0;
      displayVal = rawVal.toLocaleString();
    } else if (tab === 'time') {
      rawVal = s?.broadcastHours || 0;
      displayVal = `${rawVal.toFixed(1)}시간`;
    } else if (tab === 'spon') {
      rawVal = s?.matchCount || 0;
      displayVal = `${rawVal}판`;
    } else {
      // donor 등 빈 데이터 처리
      rawVal = 0;
      displayVal = '-';
    }

    return {
      soopId: m.soopId,
      nickname: m.nickname,
      gender: m.gender,
      isBoss: m.isBoss,
      isBirthday: isBirthdayMonth(m.soopId, yearMonth),
      isLive: Boolean(s?.isLive),
      rawVal,
      displayVal,
    };
  });

  // 티어 배지 계산 (전체 멤버 순위 기준: 상위 5%, 상위 10%, 수장)
  const sortedAll = [...rows].sort((a, b) => b.rawVal - a.rawVal);
  const totalCount = sortedAll.length;
  sortedAll.forEach((row, idx) => {
    if (row.isBoss) {
      row.tierBadge = 'boss';
    } else if (row.rawVal > 0 && idx < Math.ceil(totalCount * 0.05)) {
      row.tierBadge = 'top1';
    } else if (row.rawVal > 0 && idx < Math.ceil(totalCount * 0.15)) {
      row.tierBadge = 'top5';
    } else if (row.rawVal > 0 && idx < Math.ceil(totalCount * 0.35)) {
      row.tierBadge = 'top10';
    }
  });

  // 남자, 여자 분할 및 정렬
  const male = rows.filter((r) => r.gender === 'male').sort((a, b) => b.rawVal - a.rawVal);
  const female = rows.filter((r) => r.gender === 'female').sort((a, b) => b.rawVal - a.rawVal);

  const totalSum = rows.reduce((acc, cur) => acc + cur.rawVal, 0);
  const femaleSum = female.reduce((acc, cur) => acc + cur.rawVal, 0);
  const femaleAvg = female.length ? Math.round(femaleSum / female.length) : 0;
  const totalAvg = totalCount ? Math.round(totalSum / totalCount) : 0;

  if (tab === 'donor') {
    return {
      male,
      female,
      totalSum: 0,
      totalSumStr: '준비 중',
      femaleAvg: 0,
      femaleAvgStr: '준비 중',
      totalAvg: 0,
      totalAvgStr: '준비 중',
    };
  }

  const unit = tab === 'star' ? '개' : tab === 'time' ? '시간' : '판';

  return {
    male,
    female,
    totalSum,
    totalSumStr: `${tab === 'time' ? totalSum.toFixed(1) : totalSum.toLocaleString()}${unit}`,
    femaleAvg,
    femaleAvgStr: `${tab === 'time' || tab === 'spon' ? (femaleSum / (female.length || 1)).toFixed(1) : femaleAvg.toLocaleString()}${unit}`,
    totalAvg,
    totalAvgStr: `${tab === 'time' || tab === 'spon' ? (totalSum / (totalCount || 1)).toFixed(1) : totalAvg.toLocaleString()}${unit}`,
  };
}
