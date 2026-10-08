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

interface EdgeViewershipCacheEntry {
  data: any;
  timestamp: number;
  isClosed: boolean;
}

const VIEWERSHIP_EDGE_CACHE = new Map<string, EdgeViewershipCacheEntry>();

interface TargetStreamer {
  soopId: string;
  nickname: string;
  profileImageUrl: string | null;
  crewName: string | null;
}

function getActiveRoster(yearMonth: string): TargetStreamer[] {
  const map = new Map<string, TargetStreamer>();

  for (const crew of OFFICIAL_STAR_CREWS) {
    for (const member of crew.members) {
      const id = member.soopId.toLowerCase();
      if (!VIEWERSHIP_EXCLUDED_SOOP_IDS.has(id)) {
        map.set(id, {
          soopId: member.soopId,
          nickname: member.nickname,
          profileImageUrl: member.profileImageUrl || `https://profile.img.sooplive.co.kr/LOGO/${member.soopId.slice(0, 2)}/${member.soopId}/${member.soopId}.jpg`,
          crewName: crew.crewName,
        });
      }
    }
  }

  const indepList = INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? INDEPENDENT_STREAMERS_BY_MONTH['2026-11'] ?? [];
  for (const member of indepList) {
    const id = member.soopId.toLowerCase();
    if (!VIEWERSHIP_EXCLUDED_SOOP_IDS.has(id) && !map.has(id)) {
      map.set(id, {
        soopId: member.soopId,
        nickname: member.nickname,
        profileImageUrl: member.profileImageUrl || `https://profile.img.sooplive.co.kr/LOGO/${member.soopId.slice(0, 2)}/${member.soopId}/${member.soopId}.jpg`,
        crewName: null,
      });
    }
  }

  return Array.from(map.values());
}

interface FetchedStreamerRow {
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
}

async function fetchTrackifyMissing(
  missing: TargetStreamer[],
  yearMonth: string,
  config?: { supabaseUrl: string; anonKey: string } | null
): Promise<FetchedStreamerRow[]> {
  if (missing.length === 0) return [];

  const nowIso = new Date().toISOString();
  const chunkSize = 80;
  const resultMap = new Map<string, any>();

  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const idList = chunk.map((s) => s.soopId).join(',');
    const url = `https://www.trackify.kr/api/v1/p/soop/ranking/summary?sortKey=viewership&order=desc&range=monthly&date=${yearMonth}&page=1&size=100&ids=${encodeURIComponent(idList)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as { items?: any[] };
        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            if (item?.broadUserId) {
              resultMap.set(String(item.broadUserId).toLowerCase(), item);
            }
          }
        }
      }
    } catch {
      // Continue even if Trackify times out or fails
    }
  }

  const results: FetchedStreamerRow[] = missing.map((streamer) => {
    const item = resultMap.get(streamer.soopId.toLowerCase());
    if (item) {
      const averageViewers = Number.isFinite(Number(item.viewerAvg)) ? Math.round(Number(item.viewerAvg)) : 0;
      const peakViewers = Number.isFinite(Number(item.viewerPeak)) ? Math.round(Number(item.viewerPeak)) : 0;
      const totalViewers = Number.isFinite(Number(item.uniqueViewers)) ? Math.round(Number(item.uniqueViewers)) : 0;
      const broadcastMinutes = Number.isFinite(Number(item.broadTimeSec)) ? Math.round(Number(item.broadTimeSec) / 60) : 0;
      const viewerShip = Math.round((averageViewers * broadcastMinutes) / 60);

      return {
        soop_id: streamer.soopId,
        nickname: streamer.nickname,
        profile_image_url: streamer.profileImageUrl,
        crew_name: streamer.crewName,
        average_viewers: averageViewers,
        total_viewers: totalViewers,
        peak_viewers: peakViewers,
        broadcast_minutes: broadcastMinutes,
        viewer_ship: viewerShip,
        fetched_at: nowIso,
        viewership_status: 'available',
      };
    }

    return {
      soop_id: streamer.soopId,
      nickname: streamer.nickname,
      profile_image_url: streamer.profileImageUrl,
      crew_name: streamer.crewName,
      average_viewers: 0,
      total_viewers: 0,
      peak_viewers: 0,
      broadcast_minutes: 0,
      viewer_ship: 0,
      fetched_at: nowIso,
      viewership_status: 'available',
    };
  });

  if (config && results.length > 0) {
    const records = results.map((r) => ({
      year_month: yearMonth,
      soop_id: r.soop_id,
      nickname: r.nickname,
      profile_image_url: r.profile_image_url,
      crew_name: r.crew_name,
      average_viewers: r.average_viewers,
      total_viewers: r.total_viewers,
      peak_viewers: r.peak_viewers,
      broadcast_minutes: r.broadcast_minutes,
      stars_broadcast_minutes: r.broadcast_minutes,
      viewer_ship: r.viewer_ship,
      total_stars: 0,
      stars_source: 'trackify',
      fetched_at: r.fetched_at,
      viewership_status: r.viewership_status,
      collection_status: r.viewership_status,
    }));

    try {
      const upsertUrl = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_monthly_snapshots?on_conflict=year_month,soop_id`;
      const upsertHeaders: Record<string, string> = {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      };
      if (!config.anonKey.startsWith('sb_publishable_')) {
        upsertHeaders.Authorization = `Bearer ${config.anonKey}`;
      }
      const upsertPromise = fetch(upsertUrl, {
        method: 'POST',
        headers: upsertHeaders,
        body: JSON.stringify(records),
      }).catch(() => {});

      const ctx = getOptionalRequestContext()?.ctx;
      if (ctx?.waitUntil) {
        ctx.waitUntil(upsertPromise);
      }
    } catch {
      // Ignore background write errors
    }
  }

  return results;
}

async function savedSnapshotResponse(
  yearMonth: string,
  snapshot: ViewershipMonthlySnapshot,
  config?: { supabaseUrl: string; anonKey: string } | null
) {
  const isClosed = yearMonth < getCurrentMonthDate().slice(0, 7);
  let streamers = snapshot.streamers;

  if (yearMonth === '2026-09') {
    const savedIds = new Set(snapshot.streamers.map((streamer) => streamer.soopId.toLowerCase()));
    streamers = [...snapshot.streamers, ...SEPTEMBER_VIEWERSHIP_PLACEHOLDERS.filter((streamer) => !savedIds.has(streamer.soopId.toLowerCase()))];
  } else if (process.env.NODE_ENV !== 'test' && !isClosed) {
    const savedIds = new Set(snapshot.streamers.map((streamer) => streamer.soopId.toLowerCase()));
    const missing = getActiveRoster(yearMonth).filter((m) => !savedIds.has(m.soopId.toLowerCase()));
    if (missing.length > 0) {
      const backfilled = await fetchTrackifyMissing(missing, yearMonth, config);
      const backfilledStreamers = backfilled.map((r) => ({
        soopId: r.soop_id,
        nickname: r.nickname,
        profileImageUrl: r.profile_image_url,
        crewName: r.crew_name,
        averageViewers: r.average_viewers,
        totalViewers: r.total_viewers,
        peakViewers: r.peak_viewers,
        broadcastMinutes: r.broadcast_minutes,
        viewerShip: r.viewer_ship,
        fetchedAt: r.fetched_at,
        collectionStatus: 'available' as const,
        viewershipStatus: 'available' as const,
      }));
      streamers = [...streamers, ...backfilledStreamers];
    }
  }

  const visibleStreamers = streamers.filter((streamer) =>
    !VIEWERSHIP_EXCLUDED_SOOP_IDS.has(streamer.soopId.toLowerCase())
  );
  const globallyExcludedCount = streamers.filter((streamer) =>
    VIEWERSHIP_EXCLUDED_SOOP_IDS.has(streamer.soopId.toLowerCase())
  ).length;
  const requestedCount = Math.max(0, snapshot.requestedCount - globallyExcludedCount);
  const fetchedCount = Math.min(snapshot.fetchedCount, requestedCount);

  const body = {
    success: true,
    ...snapshot,
    yearMonth,
    isClosed,
    requestedCount: isClosed ? fetchedCount : requestedCount,
    fetchedCount,
    failedCount: isClosed ? 0 : Math.max(0, requestedCount - fetchedCount),
    streamers: visibleStreamers.map((streamer) => withMonthNickname(streamer, yearMonth)),
  };

  if (process.env.NODE_ENV !== 'test') {
    VIEWERSHIP_EDGE_CACHE.set(yearMonth, { data: body, timestamp: Date.now(), isClosed });
  }

  return NextResponse.json(body, {
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
  const isClosed = yearMonth < currentMonth;

  if (process.env.NODE_ENV !== 'test') {
    const cached = VIEWERSHIP_EDGE_CACHE.get(yearMonth);
    if (cached) {
      const ttl = isClosed ? Infinity : 60_000;
      const isMissingRoster = !isClosed && (() => {
        const active = getActiveRoster(yearMonth);
        const cachedIds = new Set(cached.data.streamers.map((s: any) => s.soopId.toLowerCase()));
        return active.some((m) => !cachedIds.has(m.soopId.toLowerCase()));
      })();

      if (!isMissingRoster && Date.now() - cached.timestamp < ttl) {
        return NextResponse.json(cached.data, {
          headers: getCacheHeaders(cached.isClosed),
        });
      }
    }
  }

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
          if (process.env.NODE_ENV !== 'test' && yearMonth === currentMonth) {
            const existingIds = new Set(rows.map((r) => r.soop_id.toLowerCase()));
            const missing = getActiveRoster(yearMonth).filter((m) => !existingIds.has(m.soopId.toLowerCase()));
            if (missing.length > 0) {
              const backfilled = await fetchTrackifyMissing(missing, yearMonth, config);
              rows.push(...backfilled);
            }
          }

          const targetIds = yearMonth === currentMonth
            ? new Set([
                ...OFFICIAL_STAR_CREWS.flatMap((crew) => crew.members.map((member) => member.soopId.toLowerCase())),
                ...(INDEPENDENT_STREAMERS_BY_MONTH[yearMonth] ?? []).map((member) => member.soopId.toLowerCase()),
              ])
            : savedSnapshot
              ? new Set(savedSnapshot.streamers.map((s) => s.soopId.toLowerCase()))
              : new Set([
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
            const body = {
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
            };
            if (process.env.NODE_ENV !== 'test') {
              VIEWERSHIP_EDGE_CACHE.set(yearMonth, { data: body, timestamp: Date.now(), isClosed });
            }
            return NextResponse.json(body, {
              headers: getCacheHeaders(isClosed),
            });
          }
      } catch {
        // Keep the checked-in snapshot available while the database is unreachable.
      }
  }

  if (yearMonth !== currentMonth && savedSnapshot) {
    return savedSnapshotResponse(yearMonth, savedSnapshot, config);
  }

  if (!savedSnapshot) {
    if (yearMonth === currentMonth) {
      const activeRoster = getActiveRoster(yearMonth);
      let missingData: FetchedStreamerRow[] = [];
      if (process.env.NODE_ENV !== 'test') {
        missingData = await fetchTrackifyMissing(activeRoster, yearMonth, config);
      }
      const dataMap = new Map(missingData.map((d) => [d.soop_id.toLowerCase(), d]));

      const visibleStreamers = activeRoster.map((member) => {
        const d = dataMap.get(member.soopId.toLowerCase());
        return {
          soopId: member.soopId,
          nickname: withMonthNickname(member, yearMonth).nickname,
          profileImageUrl: member.profileImageUrl || null,
          crewName: member.crewName,
          averageViewers: d?.average_viewers || 0,
          totalViewers: d?.total_viewers || 0,
          peakViewers: d?.peak_viewers || 0,
          broadcastMinutes: d?.broadcast_minutes || 0,
          viewerShip: d?.viewer_ship || 0,
          fetchedAt: d?.fetched_at || new Date().toISOString(),
          collectionStatus: 'available' as const,
          viewershipStatus: 'available' as const,
        };
      });

      return NextResponse.json({
        success: true,
        yearMonth,
        updatedAt: new Date().toISOString(),
        isClosed: false,
        requestedCount: visibleStreamers.length,
        fetchedCount: visibleStreamers.filter((s) => s.averageViewers > 0 || s.broadcastMinutes > 0).length,
        failedCount: 0,
        streamers: visibleStreamers,
      }, {
        headers: getCacheHeaders(false),
      });
    }

    return NextResponse.json({ success: false, yearMonth, error: 'No viewership snapshot is available' }, { status: 404 });
  }
  return savedSnapshotResponse(yearMonth, savedSnapshot, config);
}
