import { NextResponse } from 'next/server';
import { SYNC_LOG_HISTORY, type SyncLogEntry } from '@/data/syncLogs';
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

  let liveStatus: SyncLogEntry | null = null;

  if (supabaseUrl && anonKey) {
    try {
      const headers: Record<string, string> = { apikey: anonKey };
      if (!anonKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${anonKey}`;
      const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_sync_status`);
      url.searchParams.set('select', 'window_start,completed_at,completed_shards,has_failed_shard,requested_count,fetched_count,failed_count');
      url.searchParams.set('order', 'completed_at.desc');
      url.searchParams.set('limit', '1');

      const res = await fetch(url, { headers });
      if (res.ok) {
        const rows = await res.json();
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        if (row && row.completed_at) {
          const kst = new Date(new Date(row.completed_at).getTime() + 9 * 60 * 60 * 1000);
          liveStatus = {
            id: `live-${row.completed_at}`,
            timestamp: row.completed_at,
            kstTime: kst.toISOString().replace('T', ' ').slice(0, 19),
            yearMonth: `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`,
            trigger: 'schedule',
            status: Number(row.failed_count || 0) === 0 ? 'success' : 'partial',
            requestedCount: Number(row.requested_count || 238),
            fetchedCount: Number(row.fetched_count || 238),
            failedCount: Number(row.failed_count || 0),
            failedStreamers: [],
            note: 'Supabase 실시간 동기화 상태',
          };
        }
      }
    } catch {
      // Supabase 조회 실패 시 정적 로그 기본 제공
    }
  }

  // liveStatus가 정적 로그보다 최신이면 병합
  const logs = [...SYNC_LOG_HISTORY];
  if (liveStatus && (!logs[0] || new Date(liveStatus.timestamp).getTime() > new Date(logs[0].timestamp).getTime() + 60_000)) {
    logs.unshift(liveStatus);
  }

  return NextResponse.json({
    success: true,
    totalLogs: logs.length,
    latestRun: logs[0] || null,
    logs,
  });
}
