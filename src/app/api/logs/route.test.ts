import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@cloudflare/next-on-pages', () => ({ getOptionalRequestContext: () => undefined }));
import { GET } from './route';

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
