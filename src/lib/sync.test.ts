import { describe, it, expect } from 'vitest';
import { matchAndAggregate, filterChangedSnapshots } from './sync';
import { Streamer, MonthlyAggregate } from '@/types/database';
import { SoopScopeStreamerRow } from './collector';

describe('Sync & Dirty-Check Logic', () => {
  const registeredStreamers: Streamer[] = [
    {
      id: 'uuid-1',
      soop_id: 'roket0829',
      nickname: '[JS]박퍼니',
      crew_id: 'crew-1',
      is_active: true,
      created_at: '2026-10-01',
    },
    {
      id: 'uuid-2',
      soop_id: 'offline_user',
      nickname: '오프라인유저',
      crew_id: 'crew-1',
      is_active: true,
      created_at: '2026-10-01',
    },
  ];

  const scrapedRows: SoopScopeStreamerRow[] = [
    {
      rank: 1,
      soopId: 'roket0829',
      nickname: '[JS]박퍼니',
      category: '스타크래프트',
      profileImg: 'https://img.jpg',
      totalStars: 50000,
      totalMinutes: 120,
    },
  ];

  it('matches registered streamers with scraped rows and calculates stats', () => {
    const aggregates = matchAndAggregate(registeredStreamers, scrapedRows, '2026-10');

    expect(aggregates).toHaveLength(2);
    // Matched streamer
    expect(aggregates[0].streamer_id).toBe('uuid-1');
    expect(aggregates[0].total_stars).toBe(50000);
    expect(aggregates[0].broadcast_hours).toBe(2);

    // Unmatched/offline streamer
    expect(aggregates[1].streamer_id).toBe('uuid-2');
    expect(aggregates[1].total_stars).toBe(0);
  });

  it('filters out unchanged records using dirty check to prevent database bloat', () => {
    const previousMap = new Map<string, { total_stars: number; total_minutes: number }>([
      ['uuid-1', { total_stars: 40000, total_minutes: 100 }], // Changed!
      ['uuid-2', { total_stars: 0, total_minutes: 0 }],       // Unchanged!
    ]);

    const currentRecords = [
      { streamer_id: 'uuid-1', total_stars: 50000, total_minutes: 120 },
      { streamer_id: 'uuid-2', total_stars: 0, total_minutes: 0 },
    ];

    const changed = filterChangedSnapshots(previousMap, currentRecords);

    expect(changed).toHaveLength(1);
    expect(changed[0].streamer_id).toBe('uuid-1');
  });
});
