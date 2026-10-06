import { NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import { VIEWERSHIP_MONTHLY_SNAPSHOTS } from '@/data/viewershipSnapshots';
import { SEPTEMBER_VIEWERSHIP_PLACEHOLDERS } from '@/data/septemberViewershipPlaceholders';
import { OFFICIAL_STAR_CREWS } from '@/lib/starCrewsData';
import { INDEPENDENT_STREAMERS_BY_MONTH } from '@/data/independentStreamers';
import { SEPTEMBER_CURRENT_NICKNAMES } from '@/data/septemberCurrentNicknames';
import { getCurrentMonthDate } from '@/lib/month';
import { VIEWERSHIP_EXCLUDED_SOOP_IDS } from '@/lib/viewership';
import type { ViewershipMonthlySnapshot } from '@/lib/viewership';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const DISPLAY_NICKNAME_OVERRIDES: Record<string, string> = {
  ...SEPTEMBER_CURRENT_NICKNAMES,
  a6r8zfymkc6: '카나에_',
};

function withMonthNickname<T extends { soopId: string; nickname: string }>(item: T, yearMonth: string): T {
  return {
    ...item,
    nickname: ['2026-09', '2026-10'].includes(yearMonth)
      ? DISPLAY_NICKNAME_OVERRIDES[item.soopId.toLowerCase()] ?? item.nickname
      : item.nickname,
  };
}

function getSupabaseConfig() {
  const pagesEnv = getOptionalRequestContext()?.env as Record<string, string | undefined> | undefined;
  const supabaseUrl = pagesEnv?.SUPABASE_URL
    || pagesEnv?.NEXT_PUBLIC_SUPABASE_URL
    || process.env.SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = pagesEnv?.SUPABASE_ANON_KEY
    || pagesEnv?.SUPABASE_PUBLISHABLE_KEY
    || pagesEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return supabaseUrl && anonKey ? { supabaseUrl, anonKey } : null;
}

function getCacheHeaders(isClosed: boolean): HeadersInit {
  return isClosed
    ? { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, immutable' }
    : { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' };
}

function savedSnapshotResponse(yearMonth: string, snapshot: ViewershipMonthlySnapshot) {
  const isClosed = yearMonth < getCurrentMonthDate().slice(0, 7);
  const savedIds = new Set(snapshot.streamers.map((streamer) => streamer.soopId.toLowerCase()));
  const streamers = yearMonth === '2026-09'
    ? [...snapshot.streamers, ...SEPTEMBER_VIEWERSHIP_PLACEHOLDERS.filter((streamer) => !savedIds.has(streamer.soopId.toLowerCase()))]
    : snapshot.streamers;
  const visibleStreamers = streamers.filter((streamer) =>
    !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(streamer.soopId.toLowerCase())
  );
  const globallyExcludedCount = streamers.filter((streamer) =>
    VIEWERSHIP_EXCLUDED_SOOP_IDS.has(streamer.soopId.toLowerCase())
  ).length;
  const requestedCount = Math.max(0, snapshot.requestedCount - globallyExcludedCount);
  const fetchedCount = Math.min(snapshot.fetchedCount, requestedCount);

  return NextResponse.json({
    success: true,
    ...snapshot,
    yearMonth,
    isClosed,
    requestedCount: isClosed ? fetchedCount : requestedCount,
    fetchedCount,
    failedCount: isClosed ? 0 : Math.max(0, requestedCount - fetchedCount),
    streamers: visibleStreamers.map((streamer) => withMonthNickname(streamer, yearMonth)),
  }, {
    headers: getCacheHeaders(isClosed),
  });
}

export async function GET(request: Request) {
  const requestedMonth = new URL(request.url).searchParams.get('month');
  if (requestedMonth !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
    return NextResponse.json({ success: false, error: 'month must use YYYY-MM format' }, { status: 400 });
  }

  const yearMonth = requestedMonth ?? getCurrentMonthDate().slice(0, 7);
  const currentMonth = getCurrentMonthDate().slice(0, 7);
  const savedSnapshot = VIEWERSHIP_MONTHLY_SNAPSHOTS[yearMonth];

  const config = getSupabaseConfig();
  if (config) {
      try {
        const headers: Record<string, string> = { apikey: config.anonKey };
        if (!config.anonKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${config.anonKey}`;

        const queryRows = async (table: string) => {
          const url = new URL(`${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}`);
          url.searchParams.set('year_month', `eq.${yearMonth}`);
          url.searchParams.set('select', 'soop_id,nickname,profile_image_url,crew_name,average_viewers,total_viewers,peak_viewers,broadcast_minutes,viewer_ship,fetched_at,viewership_status');
          url.searchParams.set('order', 'viewer_ship.desc');
          const response = await fetch(url, { headers });
          return response.ok ? await response.json() as Array<{
            soop_id: string;
            nickname: string;
            profile_image_url: string | null;
            crew_name: string | null;
            average_viewers: number;
            total_viewers: number;
            peak_viewers: number;
            broadcast_minutes: number;
            viewer_ship: number;
            fetched_at: string;
            viewership_status: 'available' | 'unavailable' | 'excluded';
          }> : [];
        };

        const rows = await queryRows('soopscope_monthly_snapshots');

        if (rows.length > 0) {
            const targetIds = new Set([
              ...OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members.map((member) => member.soopId.toLowerCase())),
              ...(INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? []).map((member) => member.soopId.toLowerCase()),
            ]);
        const visibleRows = rows.filter((row) =>
          targetIds.has(row.soop_id.toLowerCase()) &&
          !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(row.soop_id.toLowerCase())
        );
            const isClosed = yearMonth < currentMonth;
            const requestedCount = yearMonth === currentMonth
              ? Array.from(targetIds).filter((soopId) => !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(soopId)).length
              : savedSnapshot
                ? Math.max(0, savedSnapshot.requestedCount - (savedSnapshot.streamers.length - savedSnapshot.streamers.filter((streamer) => !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(streamer.soopId.toLowerCase())).length))
                : visibleRows.length;
            const fetchedCount = visibleRows.filter((row) => row.viewership_status !== 'unavailable').length;
            return NextResponse.json({
              success: true,
              yearMonth,
              updatedAt: visibleRows.reduce((latest, row) => row.fetched_at > latest ? row.fetched_at : latest, visibleRows[0]?.fetched_at ?? rows[0].fetched_at),
              isClosed,
              requestedCount: isClosed ? fetchedCount : requestedCount,
              fetchedCount,
              failedCount: isClosed ? 0 : Math.max(0, requestedCount - fetchedCount),
              streamers: visibleRows.map((row) => withMonthNickname({
                soopId: row.soop_id,
                nickname: row.nickname,
                profileImageUrl: row.profile_image_url,
                crewName: row.crew_name,
                averageViewers: Number(row.average_viewers),
                totalViewers: Number(row.total_viewers),
                peakViewers: Number(row.peak_viewers),
                broadcastMinutes: Number(row.broadcast_minutes),
                viewerShip: Number(row.viewer_ship),
                fetchedAt: row.fetched_at,
                collectionStatus: row.viewership_status === 'unavailable' ? 'unavailable' : 'available',
              }, yearMonth)),
            }, {
              headers: getCacheHeaders(isClosed),
            });
          }
      } catch {
        // Keep the checked-in snapshot available while the database is unreachable.
      }
  }

  if (yearMonth !== currentMonth && savedSnapshot) {
    return savedSnapshotResponse(yearMonth, savedSnapshot);
  }

  if (!savedSnapshot) {
    if (yearMonth === currentMonth) {
      const visibleStreamers = [
        ...OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members.map((member) => ({ ...member, crewName: crew.crewName }))),
        ...(INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? INDEPENDENT_STREAMERS_BY_MONTH['2026-11'] ?? []).map((member) => ({ ...member, crewName: null })),
      ]
        .filter((member) => !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(member.soopId.toLowerCase()))
        .map((member) => ({
          soopId: member.soopId,
          nickname: withMonthNickname(member, yearMonth).nickname,
          profileImageUrl: member.profileImageUrl || null,
          crewName: member.crewName,
          averageViewers: 0,
          totalViewers: 0,
          peakViewers: 0,
          broadcastMinutes: 0,
          viewerShip: 0,
          fetchedAt: new Date().toISOString(),
          collectionStatus: 'available' as const,
          viewershipStatus: 'available' as const,
        }));

      return NextResponse.json({
        success: true,
        yearMonth,
        updatedAt: new Date().toISOString(),
        isClosed: false,
        requestedCount: visibleStreamers.length,
        fetchedCount: 0,
        failedCount: 0,
        streamers: visibleStreamers,
      }, {
        headers: getCacheHeaders(false),
      });
    }

    return NextResponse.json({ success: false, yearMonth, error: 'No viewership snapshot is available' }, { status: 404 });
  }
  return savedSnapshotResponse(yearMonth, savedSnapshot);
}
