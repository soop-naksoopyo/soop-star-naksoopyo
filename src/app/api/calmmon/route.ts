import { NextResponse } from 'next/server';
import { CALMMON_MEMBERS, CALMMON_DEFAULT_STATS, type StreamerStatInput } from '@/lib/calmmonData';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get('month') || '2026-10';

  const memberIds = CALMMON_MEMBERS.map((m) => m.soopId).join(',');
  const trackifyUrl = `https://www.trackify.kr/api/v1/p/soop/ranking/summary?sortKey=viewership&order=desc&range=monthly&date=${yearMonth}&page=1&size=100&ids=${encodeURIComponent(memberIds)}`;

  const resultMap: Record<string, StreamerStatInput> = { ...CALMMON_DEFAULT_STATS };
  let fetchSuccess = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(trackifyUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as any;
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item && item.broadUserId) {
            const key = item.broadUserId.toLowerCase();
            const minutes = (item.broadTimeSec || 0) / 60;
            resultMap[key] = {
              totalStars: Number(item.balloon) || 0,
              broadcastHours: Math.round((minutes / 60) * 10) / 10,
              averageViewers: Number(item.viewerAvg) || 0,
            };
          }
        }
        fetchSuccess = true;
      }
    }
  } catch (err) {
    console.warn('[calmmon api] trackify fetch warning, using defaults', err);
  }

  return NextResponse.json(
    {
      success: true,
      yearMonth,
      timestamp: new Date().toISOString(),
      source: fetchSuccess ? 'trackify_live' : 'calmmon_defaults',
      stats: resultMap,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
