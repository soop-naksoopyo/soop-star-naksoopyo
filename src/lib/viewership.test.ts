import { describe, expect, it } from 'vitest';
import { calculateViewerShip, summarizeViewershipCrews, type ViewershipStreamerSnapshot } from './viewership';

function streamer(overrides: Partial<ViewershipStreamerSnapshot>): ViewershipStreamerSnapshot {
  return {
    soopId: 'sample',
    nickname: '샘플',
    crewName: null,
    averageViewers: 0,
    totalViewers: 0,
    peakViewers: 0,
    broadcastMinutes: 0,
    viewerShip: 0,
    fetchedAt: '2026-10-04T00:00:00.000Z',
    ...overrides,
  };
}

describe('viewership calculations', () => {
  it('calculates viewer-hours from average viewers and broadcast minutes', () => {
    expect(calculateViewerShip(49, 459)).toBe(375);
    expect(calculateViewerShip(0, 459)).toBe(0);
    expect(calculateViewerShip(100, 0)).toBe(0);
  });

  it('ranks crews by mean viewers among members who broadcast', () => {
    const crews = summarizeViewershipCrews([
      streamer({ soopId: 'a', nickname: 'A', crewName: '크루A', averageViewers: 100, broadcastMinutes: 60, viewerShip: 100 }),
      streamer({ soopId: 'b', nickname: 'B', crewName: '크루A', averageViewers: 300, broadcastMinutes: 30, viewerShip: 150 }),
      streamer({ soopId: 'c', nickname: 'C', crewName: '크루A', averageViewers: 999, broadcastMinutes: 0, viewerShip: 0 }),
      streamer({ soopId: 'd', nickname: 'D', crewName: '크루B', averageViewers: 250, broadcastMinutes: 60, viewerShip: 250 }),
      streamer({ soopId: 'solo', nickname: '무소속', averageViewers: 500, broadcastMinutes: 60, viewerShip: 500 }),
    ]);

    expect(crews[0]).toMatchObject({ crewName: '크루B', activeMemberCount: 1, averageViewers: 250 });
    expect(crews[1]).toMatchObject({ crewName: '크루A', activeMemberCount: 2, averageViewers: 200, totalViewerShip: 250 });
    expect(crews).toHaveLength(2);
  });
});
