import { NextResponse } from 'next/server';
import { SYNC_LOG_HISTORY } from '@/data/syncLogs';
import type { SyncLogEntry } from '@/types/sync';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  const pagesEnv = getOptionalRequestContext()?.env as Record<string, string | undefined> | undefined;
  const supabaseUrl = (pagesEnv?.SUPABASE_URL
    || pagesEnv?.NEXT_PUBLIC_SUPABASE_URL
    || process.env.SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const anonKey = (pagesEnv?.SUPABASE_ANON_KEY
    || pagesEnv?.SUPABASE_PUBLISHABLE_KEY
    || pagesEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();

  let logs: SyncLogEntry[] = [...SYNC_LOG_HISTORY];
  let source: 'supabase' | 'file_fallback' = 'file_fallback';
  let liveError: string | undefined = 'missing_config';

  if (supabaseUrl && anonKey) {
    try {
      liveError = 'empty_history';
      const headers: Record<string, string> = { apikey: anonKey, 'Cache-Control': 'no-cache' };
      if (!anonKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${anonKey}`;
      const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_sync_logs`);
      url.searchParams.set('select', 'payload');
      url.searchParams.set('order', 'timestamp.desc');
      url.searchParams.set('limit', '200');

      // Cloudflare's edge fetch does not implement the Request.cache option.
      const res = await fetch(url, { headers });
      if (res.ok) {
        const rows = await res.json() as Array<{ payload: SyncLogEntry }>;
        if (Array.isArray(rows) && rows.length > 0) {
          logs = rows.map((row) => row.payload)
            .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
          source = 'supabase';
          liveError = undefined;
        }
      } else {
        liveError = `http_${res.status}`;
      }
    } catch (error) {
      liveError = error instanceof Error ? error.message.slice(0, 160) : 'lookup_failed';
      // Supabase 조회 실패 시 정적 로그 기본 제공
    }
  }

  return NextResponse.json({
    success: true,
    source,
    ...(source === 'file_fallback' ? { liveError, warning: '실시간 로그를 불러오지 못해 마지막 배포 시점의 기록을 표시합니다.' } : {}),
    totalLogs: logs.length,
    latestRun: logs[0] || null,
    logs,
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
