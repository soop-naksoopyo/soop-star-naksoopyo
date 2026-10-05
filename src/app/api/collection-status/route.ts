import { NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
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
    return NextResponse.json({ success: false }, { status: 503 });
  }

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_sync_status`);
  url.searchParams.set('select', 'window_start,completed_at,completed_shards,has_failed_shard,requested_count,fetched_count,failed_count,expected_shards');
  url.searchParams.set('order', 'completed_at.desc');
  url.searchParams.set('limit', '1');

  try {
    const headers: Record<string, string> = { apikey: anonKey };
    if (!anonKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${anonKey}`;
    const statusPromise = fetch(url, { headers })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null);

    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const currentMonth = `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
    const snapUrl = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_monthly_snapshots`);
    snapUrl.searchParams.set('year_month', `eq.${currentMonth}`);
    snapUrl.searchParams.set('select', 'fetched_at');
    snapUrl.searchParams.set('order', 'fetched_at.desc');
    snapUrl.searchParams.set('limit', '1');
    const snapPromise = fetch(snapUrl, { headers })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null);

    const [statusRows, snapRows] = await Promise.all([statusPromise, snapPromise]);

    const row = Array.isArray(statusRows) ? statusRows[0] : null;
    const snapRow = Array.isArray(snapRows) ? snapRows[0] : null;
    const snapTime = snapRow?.fetched_at;

    if (!row && !snapTime) return NextResponse.json({ success: true, latest: null });

    const isSnapNewer = Boolean(snapTime && (!row?.completed_at || new Date(snapTime).getTime() > new Date(row.completed_at).getTime()));
    const completedAt = isSnapNewer ? snapTime : (row?.completed_at ?? snapTime);

    return NextResponse.json({
      success: true,
      latest: {
        windowStart: isSnapNewer ? completedAt : (row?.window_start ?? completedAt),
        completedAt,
        completedShards: isSnapNewer ? 8 : Number(row?.completed_shards ?? 8),
        expectedShards: isSnapNewer ? 8 : Number(row?.expected_shards ?? 8),
        hasFailedShard: isSnapNewer ? false : Boolean(row?.has_failed_shard),
        requestedCount: isSnapNewer ? 237 : Number(row?.requested_count ?? 237),
        fetchedCount: isSnapNewer ? 237 : Number(row?.fetched_count ?? 237),
        failedCount: isSnapNewer ? 0 : Number(row?.failed_count ?? 0),
      },
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
