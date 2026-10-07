import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@cloudflare/next-on-pages', () => ({ getOptionalRequestContext: () => undefined }));
import { GET } from './route';
import type { SyncLogEntry } from '@/types/sync';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('returns sync logs successfully', async () => {
  const response = await GET();
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(Array.isArray(data.logs)).toBe(true);
  expect(data.logs.length).toBeGreaterThan(0);
  expect(data.latestRun).toBeDefined();
  expect(data.latestRun.requestedCount).toBeGreaterThan(0);
});

it('reads newly persisted logs without a site deployment and preserves zero successes', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-key');
  const entry: SyncLogEntry = {
    id: 'new-run', timestamp: '2099-01-01T00:00:00Z', kstTime: '2099-01-01 09:00:00',
    yearMonth: '2099-01', trigger: 'schedule', status: 'failed', requestedCount: 237,
    fetchedCount: 0, failedCount: 237, failedStreamers: [], durationSeconds: 12,
  };
  const fetchMock = vi.fn().mockImplementation(async (_url, options) => {
    if ('cache' in options) throw new Error("The 'cache' field is not implemented.");
    return { ok: true, json: async () => [{ payload: entry }] };
  });
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET();
  const data = await response.json();
  expect(data.source).toBe('supabase');
  expect(data.latestRun).toEqual(entry);
  expect(fetchMock.mock.calls[0][1].headers.apikey).toBe('test-key');
  expect(fetchMock.mock.calls[0][1].cache).toBeUndefined();
  expect(fetchMock.mock.calls[0][1].headers['Cache-Control']).toBe('no-cache');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});

it('exposes a stale file fallback when live log retrieval fails', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  const response = await GET();
  const data = await response.json();
  expect(data.source).toBe('file_fallback');
  expect(data.liveError).toBe('http_503');
  expect(data.warning).toBeTruthy();
  expect(data.logs.length).toBeGreaterThan(0);
});
