import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSoopScopeStreamers } from './collector';

describe('SoopScope Collector Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses streamer rankings correctly from SoopScope API', async () => {
    const mockApiResponse = {
      rows: [
        {
          rank: 1,
          soopId: 'roket0829',
          nickname: '[JS]박퍼니',
          category: '스타크래프트',
          profileImg: 'https://profile.img.sooplive.co.kr/LOGO/ro/roket0829/roket0829.jpg',
          totalStars: 2656770,
          totalMinutes: 1297,
          hourlyStars: 122904,
        },
        {
          rank: 2,
          soopId: 'galsa',
          nickname: '두치와뿌꾸',
          category: 'FC 온라인',
          profileImg: 'https://profile.img.sooplive.co.kr/LOGO/ga/galsa/galsa.jpg',
          totalStars: 1200000,
          totalMinutes: 900,
          hourlyStars: 80000,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await fetchSoopScopeStreamers('2026-10-01', '2026-10-03', 500);

    expect(result).toHaveLength(2);
    expect(result[0].soopId).toBe('roket0829');
    expect(result[0].totalStars).toBe(2656770);
    expect(result[0].totalMinutes).toBe(1297);
    expect(result[0]).not.toHaveProperty('hourlyStars');
    expect(result[1].nickname).toBe('두치와뿌꾸');
  });

  it('handles API error status gracefully by throwing descriptive error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchSoopScopeStreamers('2026-10-01', '2026-10-03')).rejects.toThrow(
      'SoopScope API responded with status 500'
    );
  });
});
