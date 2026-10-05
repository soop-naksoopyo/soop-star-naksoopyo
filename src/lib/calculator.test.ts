import { describe, it, expect } from 'vitest';
import {
  minutesToHours,
  formatStars,
  formatHours,
  aggregateCrewStats,
  getStarTierStyle,
} from './calculator';
import { Crew, StreamerWithStats } from '@/types/database';

describe('Calculator Library', () => {
  it('converts minutes to hours with 1 decimal place', () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(125)).toBe(2.1);
    expect(minutesToHours(0)).toBe(0.0);
  });

  it('formats star balloon numbers with commas', () => {
    expect(formatStars(1234567)).toBe('1,234,567');
    expect(formatStars(0)).toBe('0');
  });

  it('formats hours with hour unit string', () => {
    expect(formatHours(42.5)).toBe('42.5시간');
  });

  it('aggregates crew statistics accurately', () => {
    const mockCrew: Crew = {
      id: 'crew-1',
      name: '바스포드',
      category: 'star',
      display_order: 1,
      is_active: true,
      created_at: '2026-10-01',
    };

    const mockMembers: StreamerWithStats[] = [
      {
        id: 's1',
        soop_id: 'streamer1',
        nickname: '스트리머1',
        crew_id: 'crew-1',
        is_active: true,
        created_at: '2026-10-01',
        stats: {
          id: 'st1',
          streamer_id: 's1',
          year_month: '2026-10',
          total_stars: 100000,
          broadcast_hours: 10,
          prev_month_stars: 80000,
          diff_stars: 20000,
          updated_at: '2026-10-03',
        },
      },
      {
        id: 's2',
        soop_id: 'streamer2',
        nickname: '스트리머2',
        crew_id: 'crew-1',
        is_active: true,
        created_at: '2026-10-01',
        stats: {
          id: 'st2',
          streamer_id: 's2',
          year_month: '2026-10',
          total_stars: 50000,
          broadcast_hours: 10,
          prev_month_stars: 40000,
          diff_stars: 10000,
          updated_at: '2026-10-03',
        },
      },
    ];

    const result = aggregateCrewStats(mockCrew, mockMembers);

    expect(result.totalStars).toBe(150000);
    expect(result.totalHours).toBe(20);
    expect(result.avgStarsPerMember).toBe(75000); // 150000 / 2
  });

  it('excludes zero-star members from the per-member average', () => {
    const zeroMember: StreamerWithStats = {
      id: 's3',
      soop_id: 'streamer3',
      nickname: '스트리머3',
      crew_id: 'crew-1',
      is_active: true,
      created_at: '2026-10-01',
      stats: {
        id: 'st3',
        streamer_id: 's3',
        year_month: '2026-10',
        total_stars: 0,
        broadcast_hours: 0,
        prev_month_stars: 0,
        diff_stars: 0,
        updated_at: '2026-10-03',
      },
    };
    const base = aggregateCrewStats(
      { id: 'crew-1', name: '바스포드', category: 'star', display_order: 1, is_active: true, created_at: '2026-10-01' },
      [
        { id: 's1', soop_id: 'streamer1', nickname: '스트리머1', crew_id: 'crew-1', is_active: true, created_at: '2026-10-01', stats: { id: 'st1', streamer_id: 's1', year_month: '2026-10', total_stars: 100000, broadcast_hours: 10, prev_month_stars: 0, diff_stars: 0, updated_at: '2026-10-03' } },
        { id: 's2', soop_id: 'streamer2', nickname: '스트리머2', crew_id: 'crew-1', is_active: true, created_at: '2026-10-01', stats: { id: 'st2', streamer_id: 's2', year_month: '2026-10', total_stars: 50000, broadcast_hours: 10, prev_month_stars: 0, diff_stars: 0, updated_at: '2026-10-03' } },
        zeroMember,
      ]
    );

    expect(base.avgStarsPerMember).toBe(75000);
  });

  it('assigns ordered highlight tiers for 200k, 300k, and 400k+ star counts', () => {
    const tier400 = getStarTierStyle(400000);
    expect(tier400.tier).toBe('400k');
    expect(tier400.badge).toBe('40만+');
    expect(tier400.rowBgClass).toContain('border-l-rose-500');

    // 40만 미만은 30만 구간으로 표시
    const below400 = getStarTierStyle(399999);
    expect(below400.tier).toBe('300k');

    // 30만개 이상
    const tier300 = getStarTierStyle(350000);
    expect(tier300.tier).toBe('300k');
    expect(tier300.badge).toBe('30만+');
    expect(tier300.rowBgClass).toContain('border-l-violet-400');

    // 20만개 이상
    const tier200 = getStarTierStyle(220000);
    expect(tier200.tier).toBe('200k');
    expect(tier200.badge).toBe('20만+');
    expect(tier200.rowBgClass).toContain('border-l-emerald-400');

    // 20만개 미만은 하이라이트 없음
    const tierNormal = getStarTierStyle(199999);
    expect(tierNormal.tier).toBe('normal');
    expect(tierNormal.badge).toBeNull();
  });
});
