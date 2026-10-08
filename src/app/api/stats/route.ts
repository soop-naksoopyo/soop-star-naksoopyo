import { NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import { OFFICIAL_STAR_CREWS } from '@/lib/starCrewsData';
import { ARCHIVE_MONTHS } from '@/data/archiveData';
import { SEPTEMBER_2026_STAR_CREWS } from '@/data/septemberStarCrews';
import { INDEPENDENT_STREAMERS_BY_MONTH } from '@/data/independentStreamers';
import { SEPTEMBER_CURRENT_NICKNAMES } from '@/data/septemberCurrentNicknames';
import { getCurrentMonthDate } from '@/lib/month';
import { VIEWERSHIP_EXCLUDED_SOOP_IDS, type ViewershipMonthlySnapshot } from '@/lib/viewership';
import { VIEWERSHIP_MONTHLY_SNAPSHOTS } from '@/data/viewershipSnapshots';

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

function getCacheHeaders(isClosed: boolean): HeadersInit {
  return isClosed
    ? {
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000, immutable',
        'Cloudflare-CDN-Cache-Control': 'max-age=31536000, immutable',
      }
    : {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'max-age=60',
        'Cloudflare-CDN-Cache-Control': 'max-age=60',
      };
}

interface EdgeStatsCacheEntry {
  data: any;
  timestamp: number;
  isClosed: boolean;
}

const STATS_EDGE_CACHE = new Map<string, EdgeStatsCacheEntry>();

function localSnapshotResponse(yearMonth: string, snapshot: ViewershipMonthlySnapshot) {
  const byId = new Map(snapshot.streamers.map((s) => [s.soopId.toLowerCase(), s]));
  const starCrews = OFFICIAL_STAR_CREWS.map((crew) => ({
    ...crew,
    members: crew.members.map((member) => {
      const soopId = member.soopId.toLowerCase();
      const snap = byId.get(soopId);
      return snap ? {
        ...member,
        nickname: withMonthNickname(member, yearMonth).nickname,
        profileImageUrl: snap.profileImageUrl || member.profileImageUrl,
        totalStars: snap.totalStars,
        broadcastHours: snap.broadcastMinutes > 0 ? Math.round((snap.broadcastMinutes / 60) * 10) / 10 : 0,
        collectionStatus: snap.collectionStatus,
        starsSource: snap.starsSource,
      } : member;
    }),
  }));
  const independentStreamers = (INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? [])
    .map((member) => {
      const snap = byId.get(member.soopId.toLowerCase());
      return snap ? {
        ...member,
        nickname: withMonthNickname(member, yearMonth).nickname,
        profileImageUrl: snap.profileImageUrl || member.profileImageUrl,
        totalStars: snap.totalStars,
        broadcastHours: snap.broadcastMinutes > 0 ? Math.round((snap.broadcastMinutes / 60) * 10) / 10 : 0,
        collectionStatus: snap.collectionStatus,
        starsSource: snap.starsSource,
      } : member;
    });

  const body = {
    success: true,
    timestamp: snapshot.updatedAt || new Date().toISOString(),
    yearMonth,
    isClosed: true,
    starCrews,
    independentStreamers,
    source: 'local_viewership_snapshot',
    matchedCount: snapshot.streamers.length,
  };
  if (process.env.NODE_ENV !== 'test') {
    STATS_EDGE_CACHE.set(yearMonth, { data: body, timestamp: Date.now(), isClosed: true });
  }
  return NextResponse.json(body, {
    headers: getCacheHeaders(true),
  });
}

function fileSnapshot(source: string, yearMonth: string, error?: string) {
  const isNewLiveMonth = yearMonth > '2026-10';
  const shouldResetLiveStats = isNewLiveMonth && (source.includes('empty_database') || source.includes('initial_sync_pending'));
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    yearMonth,
    starCrews: OFFICIAL_STAR_CREWS.map((crew) => ({
      ...crew,
      members: crew.members.map((member) => ({
        ...withMonthNickname(member, yearMonth),
        totalStars: shouldResetLiveStats ? 0 : member.totalStars,
        broadcastHours: shouldResetLiveStats ? 0 : member.broadcastHours,
      })),
    })),
    independentStreamers: (INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? [])
      .map((member) => ({
        ...withMonthNickname(member, yearMonth),
        totalStars: shouldResetLiveStats ? 0 : member.totalStars,
        broadcastHours: shouldResetLiveStats ? 0 : member.broadcastHours,
      })),
    source,
    ...(error ? { error } : {}),
  }, {
    headers: getCacheHeaders(yearMonth < getCurrentMonthDate().slice(0, 7)),
  });
}

function historicalSnapshotError(yearMonth: string, status: number, error: string, matchedCount?: number) {
  return NextResponse.json({
    success: false,
    yearMonth,
    error,
    ...(matchedCount === undefined ? {} : { matchedCount }),
  }, { status });
}

export async function GET(request: Request) {
  const currentMonth = getCurrentMonthDate().slice(0, 7);
  const requestedMonth = new URL(request.url).searchParams.get('month');
  if (requestedMonth !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
    return NextResponse.json({ success: false, error: 'month must use YYYY-MM format' }, { status: 400 });
  }
  const yearMonth = requestedMonth ?? currentMonth;
  const isHistoricalMonth = yearMonth !== currentMonth;

  if (process.env.NODE_ENV !== 'test') {
    const cached = STATS_EDGE_CACHE.get(yearMonth);
    if (cached) {
      const ttl = isHistoricalMonth ? Infinity : 60_000;
      if (Date.now() - cached.timestamp < ttl) {
        return NextResponse.json(cached.data, {
          headers: getCacheHeaders(cached.isClosed),
        });
      }
    }
  }

  if (yearMonth === '2026-09') {
    const independentStreamers = INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? [];
    const starCrews = SEPTEMBER_2026_STAR_CREWS.map((crew) => ({
      ...crew,
      members: crew.members.map((member) => withMonthNickname(member, yearMonth)),
    }));
    const body = {
      success: true,
      timestamp: new Date().toISOString(),
      yearMonth,
      isClosed: true,
      starCrews,
      independentStreamers,
      source: 'september_archive',
      matchedCount: starCrews.reduce(
        (sum, crew) => sum + crew.members.filter((member) => member.totalStars > 0).length,
        0,
      ) + independentStreamers.filter((member) => member.totalStars > 0).length,
    };
    if (process.env.NODE_ENV !== 'test') {
      STATS_EDGE_CACHE.set(yearMonth, { data: body, timestamp: Date.now(), isClosed: true });
    }
    return NextResponse.json(body, {
      headers: getCacheHeaders(true),
    });
  }

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
  if (!supabaseUrl || !anonKey) {
    if (isHistoricalMonth) {
      const localSnap = VIEWERSHIP_MONTHLY_SNAPSHOTS[yearMonth];
      if (localSnap && localSnap.streamers?.length > 0) {
        return localSnapshotResponse(yearMonth, localSnap);
      }
      return historicalSnapshotError(yearMonth, 503, 'Historical snapshots require Supabase configuration');
    }
    return fileSnapshot('soopscope_file_missing_db_config', yearMonth);
  }

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_monthly_snapshots`);
  url.searchParams.set('year_month', `eq.${yearMonth}`);
  url.searchParams.set('select', 'soop_id,nickname,profile_image_url,total_stars,broadcast_minutes,stars_broadcast_minutes,collection_status,stars_source');

  try {
    const headers: Record<string, string> = { apikey: anonKey };
    if (!anonKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${anonKey}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (isHistoricalMonth) {
        const localSnap = VIEWERSHIP_MONTHLY_SNAPSHOTS[yearMonth];
        if (localSnap && localSnap.streamers?.length > 0) {
          return localSnapshotResponse(yearMonth, localSnap);
        }
        return historicalSnapshotError(yearMonth, 502, `Supabase returned ${response.status}`);
      }
      return fileSnapshot('soopscope_file_fallback', yearMonth, `Supabase returned ${response.status}`);
    }

    const rows = await response.json() as Array<{
      soop_id: string;
      nickname: string;
      profile_image_url: string | null;
      total_stars: number;
      broadcast_minutes: number;
      stars_broadcast_minutes: number;
      collection_status: 'available' | 'unavailable';
      stars_source: 'stats' | 'canonical';
    }>;
    if (rows.length === 0) {
      if (isHistoricalMonth) {
        const localSnap = VIEWERSHIP_MONTHLY_SNAPSHOTS[yearMonth];
        if (localSnap && localSnap.streamers?.length > 0) {
          return localSnapshotResponse(yearMonth, localSnap);
        }
        return historicalSnapshotError(yearMonth, 404, 'No monthly snapshot is available');
      }
      return fileSnapshot('soopscope_file_empty_database', yearMonth);
    }

    const targetIds = new Set([
      ...OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members.map((member) => member.soopId.toLowerCase())),
      ...(INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? []).map((member) => member.soopId.toLowerCase()),
    ]);
    const expectedCount = ARCHIVE_MONTHS[yearMonth]?.summary.totalMembers
      ?? Array.from(targetIds).filter((soopId) => !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(soopId)).length;
    if (isHistoricalMonth && rows.length < expectedCount) {
      const localSnap = VIEWERSHIP_MONTHLY_SNAPSHOTS[yearMonth];
      if (localSnap && localSnap.streamers?.length >= expectedCount) {
        return localSnapshotResponse(yearMonth, localSnap);
      }
      return historicalSnapshotError(yearMonth, 409, 'Monthly snapshot is incomplete', rows.length);
    }
    if (!isHistoricalMonth && rows.length < expectedCount) {
      return fileSnapshot('soopscope_initial_sync_pending', yearMonth);
    }

    const byId = new Map(rows.map((row) => [row.soop_id.toLowerCase(), row]));
    const starCrews = OFFICIAL_STAR_CREWS.map((crew) => ({
      ...crew,
      members: crew.members.map((member) => {
        const soopId = member.soopId.toLowerCase();
        const snapshot = byId.get(soopId);
        const minutes = snapshot?.stars_broadcast_minutes ?? snapshot?.broadcast_minutes;
        return snapshot ? {
          ...member,
          nickname: (yearMonth === '2026-10' ? DISPLAY_NICKNAME_OVERRIDES[soopId] : undefined) ?? snapshot.nickname,
          profileImageUrl: snapshot.profile_image_url || member.profileImageUrl,
          totalStars: snapshot.total_stars,
          broadcastHours: minutes !== null && minutes !== undefined ? Math.round((Number(minutes) / 60) * 10) / 10 : member.broadcastHours,
          collectionStatus: snapshot.collection_status,
          starsSource: snapshot.stars_source,
        } : member;
      }),
    }));
    const independentStreamers = (INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? []).map((member) => {
      const snapshot = byId.get(member.soopId.toLowerCase());
      const minutes = snapshot?.stars_broadcast_minutes ?? snapshot?.broadcast_minutes;
      return snapshot ? {
        ...member,
        nickname: (yearMonth === '2026-10'
          ? DISPLAY_NICKNAME_OVERRIDES[member.soopId.toLowerCase()]
          : undefined) ?? snapshot.nickname,
        profileImageUrl: snapshot.profile_image_url || member.profileImageUrl,
        totalStars: snapshot.total_stars,
        broadcastHours: minutes !== null && minutes !== undefined ? Math.round((Number(minutes) / 60) * 10) / 10 : member.broadcastHours,
        collectionStatus: snapshot.collection_status,
        starsSource: snapshot.stars_source,
      } : member;
    });

    const body = {
      success: true,
      timestamp: new Date().toISOString(),
      yearMonth,
      isClosed: isHistoricalMonth,
      starCrews,
      independentStreamers,
      source: 'supabase_soopscope',
      matchedCount: rows.length,
      unavailableCount: rows.filter((row) => row.collection_status === 'unavailable').length,
    };
    if (process.env.NODE_ENV !== 'test') {
      STATS_EDGE_CACHE.set(yearMonth, { data: body, timestamp: Date.now(), isClosed: isHistoricalMonth });
    }
    return NextResponse.json(body, {
      headers: getCacheHeaders(isHistoricalMonth),
    });
  } catch (error) {
    if (isHistoricalMonth) {
      return historicalSnapshotError(yearMonth, 502, (error as Error).message);
    }
    return fileSnapshot('soopscope_file_fallback', yearMonth, (error as Error).message);
  }
}
