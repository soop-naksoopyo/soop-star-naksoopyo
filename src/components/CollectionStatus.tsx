'use client';

import React from 'react';

interface CollectionRun {
  windowStart: string;
  completedAt: string;
  completedShards: number;
  expectedShards: number;
  hasFailedShard: boolean;
  requestedCount: number;
  fetchedCount: number;
  failedCount: number;
}

function formatKstTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

interface CollectionStatusProps {
  variant?: 'light' | 'dark';
}

export const CollectionStatus: React.FC<CollectionStatusProps> = ({ variant = 'light' }) => {
  const [latest, setLatest] = React.useState<CollectionRun | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUnavailable, setIsUnavailable] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/collection-status');
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error('unavailable');
        if (!cancelled) {
          setLatest(data.latest as CollectionRun | null);
          setIsUnavailable(false);
        }
      } catch {
        if (!cancelled) setIsUnavailable(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const ageMs = latest ? Date.now() - new Date(latest.completedAt).getTime() : 0;
  const isStale = Boolean(latest && ageMs > 12 * 60_000);
  const isIncomplete = Boolean(latest && latest.completedShards < latest.expectedShards);
  const hasFailures = Boolean(latest && (latest.hasFailedShard || latest.failedCount > 0));

  const isDark = variant === 'dark';
  let label = '업데이트 확인 중';
  let color = isDark
    ? 'border-slate-800 bg-slate-900/80 text-slate-400'
    : 'border-slate-200 bg-slate-50 text-slate-500';
  let dot = isDark ? 'bg-slate-500' : 'bg-slate-300';

  if (!isLoading && isUnavailable) {
    label = '업데이트 상태 확인 불가';
  } else if (!isLoading && !latest) {
    label = '업데이트 기록 없음';
  } else if (latest && isStale) {
    label = `업데이트 지연 · ${formatKstTime(latest.completedAt)}`;
    color = isDark
      ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
      : 'border-rose-200 bg-rose-50 text-rose-700';
    dot = isDark ? 'bg-rose-400' : 'bg-rose-500';
  } else if (latest && hasFailures) {
    label = `일부 데이터 갱신 지연 · ${formatKstTime(latest.completedAt)}`;
    color = isDark
      ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
      : 'border-amber-200 bg-amber-50 text-amber-800';
    dot = isDark ? 'bg-amber-400' : 'bg-amber-500';
  } else if (latest && isIncomplete) {
    label = `업데이트 중 · ${formatKstTime(latest.completedAt)}`;
    color = isDark
      ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
      : 'border-amber-200 bg-amber-50 text-amber-800';
    dot = isDark ? 'bg-amber-400' : 'bg-amber-500';
  } else if (latest) {
    label = `최근 업데이트 · ${formatKstTime(latest.completedAt)}`;
    color = isDark
      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
    dot = isDark ? 'bg-emerald-400' : 'bg-emerald-500';
  }

  return (
    <div
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-tight whitespace-nowrap transition-colors ${color}`}
      role="status"
      aria-live="polite"
      title="데이터 갱신 상태"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </div>
  );
};
