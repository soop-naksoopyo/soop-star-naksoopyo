export const runtime = 'edge';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const FALLBACK_AVATAR = 'https://res.sooplive.co.kr/images/user/thumb_user.gif';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || typeof id !== 'string' || id.trim().length < 2) {
    return Response.redirect(FALLBACK_AVATAR, 302);
  }

  const cleanId = id.toLowerCase().trim();
  const targetUrl = `https://profile.img.sooplive.co.kr/LOGO/${cleanId.slice(0, 2)}/${cleanId}/${cleanId}.jpg`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.sooplive.co.kr/',
      },
    });

    if (!res.ok) {
      return Response.redirect(FALLBACK_AVATAR, 302);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const imageBytes = await res.arrayBuffer();

    return new Response(imageBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // 7일(604800초) 동안 브라우저 및 Cloudflare Edge CDN 캐시 유지
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable',
        'CDN-Cache-Control': 'max-age=604800',
        'Cloudflare-CDN-Cache-Control': 'max-age=604800',
      },
    });
  } catch (_error) {
    return Response.redirect(FALLBACK_AVATAR, 302);
  }
}
