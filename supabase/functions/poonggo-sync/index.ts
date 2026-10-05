import { getShardIndexForMinute, getShardRange, getShardWindowStart } from '../_shared/sharding.ts';

const LEGACY_SHARD_COUNT = 5;
const AUTO_SHARD_COUNT = 7;
const BATCH_SIZE = 4;
const BATCH_DELAY_MS = 1_200;
const VIEWERSHIP_EXCLUDED_IDS = new Set(['skygkrtn', 'rlekfu6']);
const SOOPSCOPE_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ViewershipTarget {
  soop_id: string;
  nickname: string;
  profile_image_url: string | null;
  crew_name: string | null;
}

function kstMonth(): { yearMonth: string } {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yearMonth = `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
  return { yearMonth };
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

async function fetchSoopScopeStreamer(
  streamer: ViewershipTarget,
  yearMonth: string,
  fetchCanonicalStars: boolean,
  existingSnapshot?: { total_stars: number; stars_source: string },
) {
  const [year, month] = yearMonth.split('-');
  const soopId = streamer.soop_id.toLowerCase();
  const base = {
    year_month: yearMonth,
    soop_id: soopId,
    nickname: streamer.nickname,
    profile_image_url: streamer.profile_image_url,
    crew_name: streamer.crew_name,
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const headers = {
    'User-Agent': SOOPSCOPE_USER_AGENT,
    Referer: `https://soopscope.com/streamer/${encodeURIComponent(soopId)}`,
  };

  try {
    const statsUrl = `https://soopscope.com/api/streamer/${encodeURIComponent(soopId)}/stats?year=${year}&month=${Number(month)}`;
    const monthlyTotalUrl = `https://soopscope.com/api/streamer/${encodeURIComponent(soopId)}/monthly-total?year=${year}&month=${Number(month)}`;
    const [response, monthlyTotalResponse] = await Promise.all([
      fetch(statsUrl, { headers, signal: controller.signal }),
      fetchCanonicalStars
        ? fetch(monthlyTotalUrl, { headers, signal: controller.signal })
        : Promise.resolve(null),
    ]);
    if (!response.ok) {
      if (response.status === 403) {
        const errorPayload = await response.json().catch(() => null);
        if (errorPayload?.error === 'takedown') {
          return {
            ...base,
            total_stars: 0,
            average_viewers: 0,
            total_viewers: 0,
            peak_viewers: 0,
            broadcast_minutes: 0,
            stars_broadcast_minutes: 0,
            viewer_ship: 0,
            collection_status: 'unavailable',
            viewership_status: 'unavailable',
            unavailable_reason: 'takedown',
            fetched_at: new Date().toISOString(),
          };
        }
      }
      return null;
    }

    const payload = await response.json();
    const current = payload?.current;
    if (!current || typeof current !== 'object') return null;
    const totalStarsFromStats = numberOrNull(current.totalStars);
    let totalStars = totalStarsFromStats;
    let starsSource = 'stats';
    if (monthlyTotalResponse?.ok) {
      const monthlyTotalPayload = await monthlyTotalResponse.json().catch(() => null);
      const canonical = numberOrNull(monthlyTotalPayload?.canonical);
      if (canonical !== null) {
        totalStars = canonical;
        starsSource = 'canonical';
      }
    }
    if (starsSource !== 'canonical' && existingSnapshot?.stars_source === 'canonical') {
      totalStars = Number(existingSnapshot.total_stars);
      starsSource = 'canonical';
    }
    if (totalStars === null) return null;

    const excludeViewership = VIEWERSHIP_EXCLUDED_IDS.has(soopId);
    const averageViewers = excludeViewership ? 0 : numberOrNull(current.avgViewers) ?? 0;
    const totalViewers = excludeViewership ? 0 : numberOrNull(current.totalViewers) ?? 0;
    const peakViewers = excludeViewership ? 0 : numberOrNull(current.peak) ?? 0;
    const broadcastMinutes = numberOrNull(current.minutes) ?? 0;

    return {
      ...base,
      total_stars: totalStars,
      stars_source: starsSource,
      average_viewers: averageViewers,
      total_viewers: totalViewers,
      peak_viewers: peakViewers,
      broadcast_minutes: broadcastMinutes,
      stars_broadcast_minutes: broadcastMinutes,
      viewer_ship: Math.round((averageViewers * broadcastMinutes) / 60),
      collection_status: 'available',
      viewership_status: excludeViewership ? 'excluded' : 'available',
      unavailable_reason: null,
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchShard(
  shard: ViewershipTarget[],
  yearMonth: string,
  fetchCanonicalStars: boolean,
  existingById: Map<string, { total_stars: number; stars_source: string }>,
) {
  const snapshots: Record<string, unknown>[] = [];
  for (let start = 0; start < shard.length; start += BATCH_SIZE) {
    const batch = shard.slice(start, start + BATCH_SIZE);
    const results = await Promise.all(batch.map((streamer) => fetchSoopScopeStreamer(
      streamer,
      yearMonth,
      fetchCanonicalStars,
      existingById.get(streamer.soop_id.toLowerCase()),
    )));
    snapshots.push(...results.filter((row): row is NonNullable<typeof row> => row !== null));
    if (start + BATCH_SIZE < shard.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  return snapshots;
}

async function postRows(baseUrl: string, serviceKey: string, table: string, rows: unknown[], conflict?: string) {
  const suffix = conflict ? `?on_conflict=${conflict}` : '';
  return fetch(`${baseUrl}/rest/v1/${table}${suffix}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: conflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
}

// Keep this endpoint slug during the transition from the five legacy jobs to the auto-rotating job.
Deno.serve(async (request) => {
  const expectedSecret = Deno.env.get('SOOPSCOPE_CRON_SECRET') || Deno.env.get('POONGGO_CRON_SECRET');
  if (!expectedSecret || request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  const requestUrl = new URL(request.url);
  const dispatchTime = Date.now();
  const shardValue = requestUrl.searchParams.get('shard');
  const autoShard = shardValue === 'auto';
  const shardCount = autoShard ? AUTO_SHARD_COUNT : LEGACY_SHARD_COUNT;
  const shardIndex = autoShard
    ? getShardIndexForMinute(dispatchTime, AUTO_SHARD_COUNT)
    : shardValue === null ? NaN : Number(shardValue);
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
    return Response.json({ error: 'shard must be auto or an integer from 0 through 4' }, { status: 400 });
  }

  const currentMonth = kstMonth().yearMonth;
  const requestedMonth = requestUrl.searchParams.get('month');
  if (requestedMonth !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
    return Response.json({ error: 'month must use YYYY-MM format' }, { status: 400 });
  }
  const yearMonth = requestedMonth ?? currentMonth;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: 'Supabase server credentials are not configured' }, { status: 500 });
  }

  const startedAt = Date.now();
  const windowStart = new Date(getShardWindowStart(dispatchTime, shardCount)).toISOString();
  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const serviceHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  if (!autoShard) {
    const recentAutoUrl = new URL(`${baseUrl}/rest/v1/soopscope_sync_runs`);
    recentAutoUrl.searchParams.set('shard_count', 'eq.7');
    recentAutoUrl.searchParams.set('year_month', `eq.${yearMonth}`);
    recentAutoUrl.searchParams.set('completed_at', `gte.${new Date(Date.now() - 8 * 60_000).toISOString()}`);
    recentAutoUrl.searchParams.set('select', 'completed_at');
    recentAutoUrl.searchParams.set('order', 'completed_at.desc');
    recentAutoUrl.searchParams.set('limit', '1');
    const recentAutoResponse = await fetch(recentAutoUrl, { headers: serviceHeaders });
    if (recentAutoResponse.ok && (await recentAutoResponse.json() as unknown[]).length > 0) {
      return Response.json({ success: true, source: 'soopscope', status: 'legacy_schedule_superseded' });
    }
  }

  const rosterUrl = new URL(`${baseUrl}/rest/v1/soopscope_monthly_roster`);
  rosterUrl.searchParams.set('year_month', `eq.${yearMonth}`);
  rosterUrl.searchParams.set('select', 'soop_id,nickname,profile_image_url,crew_name');
  rosterUrl.searchParams.set('order', 'soop_id.asc');

  const rosterResponse = await fetch(rosterUrl, { headers: serviceHeaders });
  if (!rosterResponse.ok) {
    return Response.json({ error: `SoopScope roster lookup failed (${rosterResponse.status})` }, { status: 502 });
  }
  const roster = await rosterResponse.json() as ViewershipTarget[];
  if (roster.length === 0) {
    return Response.json({ error: `No SoopScope targets found for ${yearMonth}` }, { status: 502 });
  }

  const { start, end } = getShardRange(roster.length, shardIndex, shardCount);
  const shard = roster.slice(start, end);
  const existingUrl = new URL(`${baseUrl}/rest/v1/soopscope_monthly_snapshots`);
  existingUrl.searchParams.set('year_month', `eq.${yearMonth}`);
  existingUrl.searchParams.set('soop_id', `in.(${shard.map((target) => target.soop_id).join(',')})`);
  existingUrl.searchParams.set('select', 'soop_id,total_stars,stars_source');
  const existingResponse = await fetch(existingUrl, { headers: serviceHeaders });
  if (!existingResponse.ok) {
    return Response.json({ error: `SoopScope snapshot lookup failed (${existingResponse.status})` }, { status: 502 });
  }
  const existingRows = await existingResponse.json() as Array<{
    soop_id: string;
    total_stars: number;
    stars_source: string;
  }>;
  const existingById = new Map(existingRows.map((row) => [row.soop_id.toLowerCase(), row]));
  const snapshots = await fetchShard(shard, yearMonth, autoShard, existingById);
  const fetchedCount = snapshots.filter((row) => row.collection_status !== 'unavailable').length;
  let status = fetchedCount === shard.length ? 'success' : 'partial';
  let errorMessage: string | null = null;

  if (snapshots.length > 0) {
    const upsert = await postRows(
      baseUrl,
      serviceKey,
      'soopscope_monthly_snapshots',
      snapshots,
      'year_month,soop_id',
    );
    if (!upsert.ok) {
      status = 'failed';
      errorMessage = `Snapshot upsert failed (${upsert.status})`;
    }
    if (status !== 'failed') {
      if (snapshots.length < shard.length) {
        errorMessage = `${shard.length - snapshots.length} streamer requests failed`;
      } else if (fetchedCount < shard.length) {
        errorMessage = `${shard.length - fetchedCount} streamers are unavailable from SoopScope`;
      }
    }
  } else {
    status = 'failed';
    errorMessage = 'No SoopScope rows were fetched';
  }

  const durationMs = Date.now() - startedAt;
  const log = await postRows(baseUrl, serviceKey, 'soopscope_sync_runs', [{
    window_start: windowStart,
    shard_count: shardCount,
    shard_index: shardIndex,
    year_month: yearMonth,
    status,
    requested_count: shard.length,
    fetched_count: fetchedCount,
    fallback_count: 0,
    failed_count: shard.length - fetchedCount,
    duration_ms: durationMs,
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  }], 'window_start,shard_count,shard_index');
  if (!log.ok) {
    return Response.json({ error: `SoopScope run log upsert failed (${log.status})` }, { status: 502 });
  }

  const summary = {
    source: 'soopscope',
    shard: shardIndex,
    expectedShards: shardCount,
    yearMonth,
    status,
    requested: shard.length,
    fetched: fetchedCount,
    failed: shard.length - fetchedCount,
    durationMs,
  };
  console.log(JSON.stringify(summary));
  return Response.json({ success: status !== 'failed', ...summary }, { status: status === 'failed' ? 502 : 200 });
});
