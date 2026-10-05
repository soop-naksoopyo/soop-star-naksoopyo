export interface CrewRankRecord {
  rank: number;
  crewName: string;
  memberCount: number;
  totalStars: number;
  avgStars: number;
}

export interface MonthlyArchiveData {
  yearMonth: string; // e.g. "2026-09", "2026-10"
  label: string; // e.g. "2026년 9월", "2026년 10월"
  isClosed: boolean; // 마감 여부
  closedAt?: string; // 마감 일시
  summary: {
    totalStars: number;
    totalMembers: number;
    topCrew: string;
    topCrewStars: number;
    topProductiveCrew: string;
    topProductiveStars: number;
  };
  ranks: CrewRankRecord[];
}

export const ARCHIVE_MONTHS: Record<string, MonthlyArchiveData> = {
  '2026-09': {
    yearMonth: '2026-09',
    label: '2026년 9월',
    isClosed: true,
    closedAt: '2026-09-30 23:59:59 마감 확정',
    summary: {
      totalStars: 25261548,
      totalMembers: 200,
      topCrew: '캄몬',
      topCrewStars: 3394912,
      topProductiveCrew: '캄몬',
      topProductiveStars: 212182,
    },
    ranks: [
      {
        rank: 1,
        crewName: '캄몬',
        memberCount: 16,
        totalStars: 3394912,
        avgStars: 212182,
      },
      {
        rank: 2,
        crewName: '더블비',
        memberCount: 12,
        totalStars: 2079245,
        avgStars: 173270,
      },
      {
        rank: 3,
        crewName: '드림즈',
        memberCount: 15,
        totalStars: 2552255,
        avgStars: 170150,
      },
      {
        rank: 4,
        crewName: '극락회',
        memberCount: 9,
        totalStars: 1511937,
        avgStars: 167993,
      },
      {
        rank: 5,
        crewName: 'JSA',
        memberCount: 21,
        totalStars: 3015504,
        avgStars: 143595,
      },
      {
        rank: 6,
        crewName: '와플대',
        memberCount: 14,
        totalStars: 1674002,
        avgStars: 119572,
      },
      {
        rank: 7,
        crewName: '케이대',
        memberCount: 20,
        totalStars: 2206338,
        avgStars: 110317,
      },
      {
        rank: 8,
        crewName: '마범대',
        memberCount: 14,
        totalStars: 1486423,
        avgStars: 106173,
      },
      {
        rank: 9,
        crewName: '뉴캣슬',
        memberCount: 22,
        totalStars: 2256923,
        avgStars: 102587,
      },
      {
        rank: 10,
        crewName: 'DM',
        memberCount: 11,
        totalStars: 1085300,
        avgStars: 98664,
      },
      {
        rank: 11,
        crewName: '흑카데미',
        memberCount: 17,
        totalStars: 1658771,
        avgStars: 97575,
      },
      {
        rank: 12,
        crewName: '신세계',
        memberCount: 11,
        totalStars: 988116,
        avgStars: 89829,
      },
      {
        rank: 13,
        crewName: 'BGM',
        memberCount: 18,
        totalStars: 1351822,
        avgStars: 75101,
      },
    ],
  },
};
