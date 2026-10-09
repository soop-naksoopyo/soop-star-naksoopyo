import React from 'react';
import { CollectionStatus } from '@/components/CollectionStatus';

export const Header: React.FC = () => {
  return (
    <header className="relative isolate mb-5 w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 px-5 py-5 text-white shadow-sm 2xl:max-w-[1720px] sm:px-7 sm:py-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-28 h-72 w-72 rounded-full border border-emerald-300/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-20 h-56 w-56 rounded-full border border-white/5" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300 sm:text-[11px]">
            <span className="h-px w-6 bg-emerald-400" />
            SOOP / STAR CREW DASHBOARD
          </div>
          <h1 className="text-3xl font-black leading-none tracking-tight sm:text-4xl">
            스타크루 <span className="text-emerald-300">대시보드</span>
          </h1>
          <p className="mt-2 text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
            스타크루별 별풍선 · 뷰어십 순위와 방송 통계
          </p>
        </div>
        <div className="flex shrink-0 items-center self-start sm:self-center">
          <CollectionStatus variant="dark" />
        </div>
      </div>
    </header>
  );
};
