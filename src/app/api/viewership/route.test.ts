import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@cloudflare/next-on-pages', () => ({ getOptionalRequestContext: () => undefined }));
import { GET } from './route';
import { VIEWERSHIP_MONTHLY_SNAPSHOTS } from '@/data/viewershipSnapshots';
import { VIEWERSHIP_EXCLUDED_SOOP_IDS } from '@/lib/viewership';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('returns a saved archived viewership snapshot', async () => {
  const response = await GET(new Request('https://app.test/api/viewership?month=2026-09'));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toContain('immutable');
  expect(data.success).toBe(true);
  expect(data.yearMonth).toBe('2026-09');
});

it('uses the live SoopScope snapshot when Supabase is configured', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
    soop_id: 'freshtomato',
    nickname: '토마토',
    profile_image_url: null,
    crew_name: '캄몬',
    average_viewers: 2758,
    total_viewers: 66358,
    peak_viewers: 5953,
    broadcast_minutes: 7419,
    viewer_ship: 340967,
    fetched_at: '2026-10-04T12:00:00.000Z',
    collection_status: 'available',
    viewership_status: 'available',
  }, {
    soop_id: 'skygkrtn',
    nickname: '김학수',
    profile_image_url: null,
    crew_name: 'BGM',
    average_viewers: 2593,
    total_viewers: 20150,
    peak_viewers: 5053,
    broadcast_minutes: 1293,
    viewer_ship: 55879,
    fetched_at: '2026-10-04T12:00:00.000Z',
    collection_status: 'available',
    viewership_status: 'available',
  }, {
    soop_id: 'rlekfu6',
    nickname: '박재혁',
    profile_image_url: null,
    crew_name: '더블비',
    average_viewers: 918,
    total_viewers: 9488,
    peak_viewers: 1851,
    broadcast_minutes: 3885,
    viewer_ship: 59441,
    fetched_at: '2026-10-04T12:00:00.000Z',
    collection_status: 'available',
    viewership_status: 'available',
  }]), { status: 200 })));

  const currentMonth = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const response = await GET(new Request(`https://app.test/api/viewership?month=${currentMonth}`));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toContain('max-age=30');
  expect(data.streamers[0]).toMatchObject({
    soopId: 'freshtomato',
    nickname: 'Fresh토마토',
    averageViewers: 2758,
    crewName: '캄몬',
  });
  expect(data.requestedCount).toBe(232);
  expect(data.fetchedCount).toBe(1);
  expect(data.failedCount).toBe(231);
  expect(data.streamers.map((streamer: { soopId: string }) => streamer.soopId)).toEqual([
    'freshtomato',
  ]);
});

it('rejects malformed months', async () => {
  const response = await GET(new Request('https://app.test/api/viewership?month=2026-13'));
  expect(response.status).toBe(400);
});

it('returns not found for months without a snapshot', async () => {
  const response = await GET(new Request('https://app.test/api/viewership?month=2026-08'));
  expect(response.status).toBe(404);
});

it('returns graceful initial roster for a new live month before first snapshot is available', async () => {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  // Mock current month as 2026-11
  vi.spyOn(await import('@/lib/month'), 'getCurrentMonthDate').mockReturnValue('2026-11-01');

  const response = await GET(new Request('https://app.test/api/viewership?month=2026-11'));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.yearMonth).toBe('2026-11');
  expect(data.streamers.length).toBeGreaterThan(0);
  expect(data.streamers[0].viewerShip).toBe(0);
  expect(data.streamers[0].averageViewers).toBe(0);
});
