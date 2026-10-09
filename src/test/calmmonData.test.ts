import { describe, it, expect } from 'vitest';
import {
  CALMMON_MEMBERS,
  CALMMON_BIRTHDAYS,
  isBirthdayMonth,
  calculateCalmmonStats,
} from '@/lib/calmmonData';

describe('calmmonData', () => {
  it('총 17명(남자 6명, 여자 11명) 메타데이터가 존재해야 한다', () => {
    expect(CALMMON_MEMBERS.length).toBe(17);
    const male = CALMMON_MEMBERS.filter((m) => m.gender === 'male');
    const female = CALMMON_MEMBERS.filter((m) => m.gender === 'female');
    expect(male.length).toBe(6);
    expect(female.length).toBe(11);
  });

  it('17명 멤버 전체의 생일 정보가 CALMMON_BIRTHDAYS에 등록되어 있어야 한다', () => {
    expect(Object.keys(CALMMON_BIRTHDAYS).length).toBe(17);
    for (const member of CALMMON_MEMBERS) {
      expect(CALMMON_BIRTHDAYS[member.soopId.toLowerCase()]).toBeDefined();
    }
  });

  it('해당 월이 생일인 멤버에게 isBirthdayMonth가 true를 반환해야 한다', () => {
    // 주하랑: 10월 15일 -> 10월에 🎂
    expect(isBirthdayMonth('fpahsdltu1', '2026-10')).toBe(true);
    expect(isBirthdayMonth('fpahsdltu1', '2026-11')).toBe(false);

    // 김윤환: 6월 13일 -> 6월에 🎂
    expect(isBirthdayMonth('brainzerg7', '2026-06')).toBe(true);
    expect(isBirthdayMonth('brainzerg7', '2026-10')).toBe(false);

    // 임조이: 11월 11일 -> 11월에 🎂
    expect(isBirthdayMonth('dlaguswl501', '2026-11')).toBe(true);
    expect(isBirthdayMonth('dlaguswl501', '2026-10')).toBe(false);
  });

  it('별풍선 탭 기준 남/여 정렬 및 합계/평균이 올바르게 계산되어야 한다', () => {
    const mockStatsMap = new Map([
      ['brainzerg7', { totalStars: 80000, broadcastHours: 30, averageViewers: 3000 }],
      ['freshtomato', { totalStars: 150000, broadcastHours: 60, averageViewers: 1000 }],
      ['minchul', { totalStars: 60000, broadcastHours: 25, averageViewers: 2000 }],
    ]);

    const result = calculateCalmmonStats(mockStatsMap, 'star', '2026-10');
    expect(result.male[0].nickname).toBe('김윤환');
    expect(result.female[0].nickname).toBe('토마토');
    expect(result.totalSum).toBeGreaterThan(0);
    expect(result.male.find((m) => m.soopId === 'brainzerg7')?.tierBadge).toBe('boss');
  });

  it('스폰 판수 탭 기준 경기수가 올바르게 집계되고 정렬되어야 한다', () => {
    const mockStatsMap = new Map();
    const sponResult = calculateCalmmonStats(mockStatsMap, 'spon', '2026-10');
    expect(sponResult.totalSum).toBeGreaterThan(0);
    expect(sponResult.totalSumStr).toContain('판');
    expect(sponResult.female[0].displayVal).toContain('판');

    // donor 탭은 준비 중 상태여야 함
    const donorResult = calculateCalmmonStats(mockStatsMap, 'donor', '2026-10');
    expect(donorResult.totalSumStr).toBe('준비 중');
    expect(donorResult.male[0].displayVal).toBe('-');
  });

  it('2026년 9월 조회 시 9월 마감 통계(CALMMON_SEPTEMBER_STATS)가 폴백으로 적용되어야 한다', () => {
    const emptyMap = new Map();
    const septResult = calculateCalmmonStats(emptyMap, 'spon', '2026-09');
    // 9월 김민철은 80판
    const minchulRow = septResult.male.find((m) => m.soopId === 'minchul');
    expect(minchulRow?.rawVal).toBe(80);
    expect(minchulRow?.displayVal).toBe('80판');

    // 9월 별풍선 김윤환 289,027개
    const starResult = calculateCalmmonStats(emptyMap, 'star', '2026-09');
    const bossRow = starResult.male.find((m) => m.soopId === 'brainzerg7');
    expect(bossRow?.rawVal).toBe(289027);
  });

  it('isLive 필드가 true인 경우 멤버 행의 isLive가 true로 전달되어야 한다', () => {
    const mockStatsMap = new Map([
      ['brainzerg7', { totalStars: 90000, broadcastHours: 35, isLive: true }],
      ['freshtomato', { totalStars: 200000, broadcastHours: 70, isLive: false }],
    ]);
    const result = calculateCalmmonStats(mockStatsMap, 'star', '2026-10');
    expect(result.male.find((m) => m.soopId === 'brainzerg7')?.isLive).toBe(true);
    expect(result.female.find((m) => m.soopId === 'freshtomato')?.isLive).toBe(false);
  });
});
