import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('redirects to fallback when id is missing or too short', async () => {
  const res1 = await GET(new Request('https://app.test/api/avatar'));
  expect(res1.status).toBe(302);
  expect(res1.headers.get('Location')).toContain('thumb_user.gif');

  const res2 = await GET(new Request('https://app.test/api/avatar?id=a'));
  expect(res2.status).toBe(302);
  expect(res2.headers.get('Location')).toContain('thumb_user.gif');
});

it('fetches upstream avatar and returns with 7-day cache headers', async () => {
  const dummyBytes = new Uint8Array([1, 2, 3, 4]).buffer;
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'image/jpeg' }),
    arrayBuffer: async () => dummyBytes,
  });
  vi.stubGlobal('fetch', fetchMock);

  const res = await GET(new Request('https://app.test/api/avatar?id=brainzerg7'));
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  expect(res.headers.get('Cache-Control')).toContain('max-age=604800');
  expect(res.headers.get('CDN-Cache-Control')).toContain('max-age=604800');
  expect(fetchMock).toHaveBeenCalledWith(
    'https://profile.img.sooplive.co.kr/LOGO/br/brainzerg7/brainzerg7.jpg',
    expect.any(Object)
  );
});

it('redirects to fallback when upstream returns 404 or fails', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
  });
  vi.stubGlobal('fetch', fetchMock);

  const res = await GET(new Request('https://app.test/api/avatar?id=nonexistent'));
  expect(res.status).toBe(302);
  expect(res.headers.get('Location')).toContain('thumb_user.gif');
});
