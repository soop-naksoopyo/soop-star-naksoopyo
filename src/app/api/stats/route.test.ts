import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';
import { OFFICIAL_STAR_CREWS } from '@/lib/starCrewsData';
import { INDEPENDENT_STREAMERS_BY_MONTH } from '@/data/independentStreamers';

vi.mock('@cloudflare/next-on-pages', () => ({
  getOptionalRequestContext: () => undefined,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('returns the checked-in fallback without fetching or overwriting it', async () => {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
  const member = OFFICIAL_STAR_CREWS[0].members[0];
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      rows: [{ soopId: member.soopId, totalStars: 1, totalMinutes: 60 }],
    }),
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats'));
  const data = await response.json();

  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '캄몬').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'freshtomato', nickname: 'Fresh토마토' })]));
  expect(data.independentStreamers).toEqual(INDEPENDENT_STREAMERS_BY_MONTH['2026-10']);
  expect(data.independentStreamers).toHaveLength(11);
  expect(data.independentStreamers).not.toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'forweourus' })]));
  expect(data.independentStreamers.every((streamer: { crewName?: string }) => !streamer.crewName)).toBe(true);
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '신세계').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'a6r8zfymkc6', nickname: '카나에_' })]));
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '소병대').members)
    .not.toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'parkbano' })]));
  expect(data.source).toBe('soopscope_file_missing_db_config');
  expect(data.success).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('uses a complete SoopScope snapshot for the current month', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  const member = OFFICIAL_STAR_CREWS[0].members[0];
  const independent = INDEPENDENT_STREAMERS_BY_MONTH['2026-10'].find((streamer) => streamer.soopId === 'parkbano')!;
  const kanae = OFFICIAL_STAR_CREWS.find((crew) => crew.crewName === '신세계')!.members.find((streamer) => streamer.soopId === 'a6r8zfymkc6')!;
  const byId = new Map([
    ...OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members),
    ...INDEPENDENT_STREAMERS_BY_MONTH['2026-10'],
  ].map((streamer) => [streamer.soopId.toLowerCase(), streamer]));
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => Array.from(byId.values(), (streamer) => ({
      soop_id: streamer.soopId,
      nickname: streamer.nickname,
      profile_image_url: streamer.profileImageUrl,
      crew_name: streamer.crewName ?? null,
      collection_status: 'available',
      stars_source: 'canonical',
      total_stars: streamer.soopId === member.soopId ? 123456 : streamer.soopId === kanae.soopId ? 500 : streamer.soopId === independent.soopId ? 450 : 0,
      broadcast_minutes: streamer.soopId === member.soopId ? 510 : streamer.soopId === kanae.soopId ? 120 : streamer.soopId === independent.soopId ? 486 : 0,
    })),
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats'));
  const data = await response.json();

  const url = new URL(fetchMock.mock.calls[0][0].toString());
  expect(url.pathname).toContain('/rest/v1/soopscope_monthly_snapshots');
  expect(url.searchParams.get('select')).toContain('total_stars');
  expect(url.searchParams.get('select')).toContain('broadcast_minutes');
  expect(data.source).toBe('supabase_soopscope');
  expect(data.matchedCount).toBe(237);
  expect(data.starCrews[0].members[0].totalStars).toBe(123456);
  expect(data.starCrews[0].members[0].broadcastHours).toBe(8.5);
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '캄몬').members)
    .toEqual(expect.arrayContaining([
      expect.objectContaining({ soopId: 'freshtomato', nickname: 'Fresh토마토' }),
      expect.objectContaining({ soopId: 'seemin88', nickname: '비타밍♥' }),
    ]));
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '신세계').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'a6r8zfymkc6', nickname: '카나에_', totalStars: 500 })]));
  expect(data.independentStreamers)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'parkbano', nickname: '시라소니aa', totalStars: 450, broadcastHours: 8.1 })]));
  expect(data.independentStreamers).not.toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'forweourus' })]));
  expect(fetchMock).toHaveBeenCalledOnce();
});

it('serves Supabase stats even when inactive streamers have stars_source stats instead of canonical', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  const byId = new Map([
    ...OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members),
    ...INDEPENDENT_STREAMERS_BY_MONTH['2026-10'],
  ].map((streamer) => [streamer.soopId.toLowerCase(), streamer]));
  let index = 0;
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => Array.from(byId.values(), (streamer) => ({
      soop_id: streamer.soopId,
      nickname: streamer.nickname,
      profile_image_url: streamer.profileImageUrl,
      crew_name: streamer.crewName ?? null,
      collection_status: 'available',
      stars_source: (index++ % 5 === 0) ? 'stats' : 'canonical',
      total_stars: 1000,
      broadcast_minutes: 300,
    })),
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats'));
  const data = await response.json();

  expect(data.source).toBe('supabase_soopscope');
  expect(data.matchedCount).toBe(237);
});

it('keeps the full checked-in snapshot until the first SoopScope shard cycle completes', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{
      soop_id: 'dkwkal',
      nickname: '탱크~_~',
      profile_image_url: null,
      crew_name: '드림즈',
      total_stars: 2704,
      broadcast_minutes: 372,
    }],
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats'));
  const data = await response.json();

  expect(data.source).toBe('soopscope_initial_sync_pending');
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '캄몬').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'freshtomato', nickname: 'Fresh토마토' })]));
});

it('accepts the public environment variable names from the Supabase Next.js screen', async () => {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats'));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.source).toBe('soopscope_file_empty_database');
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][0].toString()).toContain('example.supabase.co');
});

it('returns the September archive with its September crew membership and stats', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats?month=2026-09'));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.yearMonth).toBe('2026-09');
  expect(data.source).toBe('september_archive');
  expect(data.starCrews).toHaveLength(13);
  expect(data.matchedCount).toBe(210);
  expect(data.independentStreamers).toHaveLength(10);
  expect(data.independentStreamers).not.toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'forweourus' })]));
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === 'BGM').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'yyssaa33', nickname: '제티♥' })]));
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '마범대').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'qocnrhdwn1', nickname: '연수♥' })]));
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === '캄몬').members)
    .toEqual(expect.arrayContaining([expect.objectContaining({ soopId: 'freshtomato', nickname: 'Fresh토마토' })]));
  expect(data.starCrews.flatMap((crew: { members: Array<{ soopId: string; nickname: string }> }) => crew.members)
    .find((member: { soopId: string }) => member.soopId === 'sksmsskdsl10')?.nickname).toBe('낭니♥');
  expect(data.starCrews.find((crew: { crewName: string }) => crew.crewName === 'DM').members)
    .not.toEqual(expect.arrayContaining([expect.objectContaining({ nickname: '임진묵' })]));
  expect(data.starCrews.flatMap((crew: { members: Array<{ soopId: string }> }) => crew.members)
    .some((member: { soopId: string }) => member.soopId === 'heksd' || member.soopId === 'qhkrwns12')).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('returns a complete archived month requested by year-month', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  const roster = OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members);
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => roster.map((member) => ({
      soop_id: member.soopId,
      nickname: member.nickname,
      profile_image_url: member.profileImageUrl,
      crew_name: null,
      total_stars: 765,
      broadcast_minutes: 750,
    })),
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats?month=2026-08'));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.yearMonth).toBe('2026-08');
  expect(data.isClosed).toBe(true);
  expect(data.matchedCount).toBe(roster.length);
  expect(data.starCrews[0].members[0].totalStars).toBe(765);
  expect(fetchMock.mock.calls[0][0].searchParams.get('year_month')).toBe('eq.2026-08');
});

it('does not fall back to current file data when an archived month is missing', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(new Request('https://app.test/api/stats?month=2026-08'));
  const data = await response.json();

  expect(response.status).toBe(404);
  expect(data.success).toBe(false);
  expect(data.yearMonth).toBe('2026-08');
});
