import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllGlobals());

it('retires the old sync endpoint without calling SoopScope', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET();
  expect(response.status).toBe(410);
  expect((await response.json()).success).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
