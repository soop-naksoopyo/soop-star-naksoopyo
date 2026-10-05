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
  url.searchParams.set('expected_shards', 'eq.7');
  url.searchParams.set('order', 'window_start.desc');
  url.searchParams.set('limit', '1');

  try {
    const headers: Record<string, string> = { apikey: anonKey };
    if (!anonKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${anonKey}`;
    const response = await fetch(url, { headers });
    if (!response.ok) return NextResponse.json({ success: false }, { status: 502 });

    const rows = await response.json() as Array<{
      window_start: string;
      completed_at: string;
      completed_shards: number;
      has_failed_shard: boolean;
      requested_count: number;
      fetched_count: number;
      failed_count: number;
      expected_shards: number;
    }>;
    const row = rows[0];
    if (!row) return NextResponse.json({ success: true, latest: null });

    return NextResponse.json({
      success: true,
      latest: {
        windowStart: row.window_start,
        completedAt: row.completed_at,
        completedShards: Number(row.completed_shards),
        expectedShards: Number(row.expected_shards),
        hasFailedShard: Boolean(row.has_failed_shard),
        requestedCount: Number(row.requested_count),
        fetchedCount: Number(row.fetched_count),
        failedCount: Number(row.failed_count),
      },
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
