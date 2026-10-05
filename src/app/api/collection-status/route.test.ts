import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@cloudflare/next-on-pages', () => ({
  getOptionalRequestContext: () => undefined,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('returns aggregate shard freshness and collection failures', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  const completedAt = new Date().toISOString();
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{
      window_start: '2026-10-04T07:25:00Z',
      completed_at: completedAt,
      completed_shards: 5,
      has_failed_shard: true,
      requested_count: 221,
      fetched_count: 220,
      failed_count: 1,
      expected_shards: 5,
    }],
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET();
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.latest).toEqual({
    windowStart: '2026-10-04T07:25:00Z',
    completedAt,
    completedShards: 5,
    expectedShards: 5,
    hasFailedShard: true,
    requestedCount: 221,
    fetchedCount: 220,
    failedCount: 1,
  });
  expect(fetchMock.mock.calls[0][0].toString()).toContain('/rest/v1/soopscope_sync_status');
});

it('reports unavailable when Supabase is not configured', async () => {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');

  const response = await GET();
  const data = await response.json();

  expect(response.status).toBe(503);
  expect(data.success).toBe(false);
});
