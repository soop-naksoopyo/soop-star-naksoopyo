'use client';

import React from 'react';
import { StarCrewGroup } from '@/lib/starCrewsData';
import { formatStars } from '@/lib/calculator';
import { CrewCrest } from './CrewCrest';

interface CrewRankSummaryProps {
  crews?: StarCrewGroup[];
  customRanks?: CrewRankStat[];
  titleBadge?: string;
  onSelectCrew?: (crewName: string) => void;
  title?: string;
  rankDescription?: string;
  totalColumnLabel?: string;
  averageColumnLabel?: string;
  totalSummaryLabel?: string;
  averageSummaryLabel?: string;
  valueUnit?: string;
  formatValue?: (value: number) => string;
}

export interface CrewRankStat {
  crewName: string;
  memberCount: number;
  totalStars: number;
  avgStars: number;
  rank: number;
}

export const CrewRankSummary: React.FC<CrewRankSummaryProps> = ({
  crews = [],
  customRanks,
  titleBadge,
  onSelectCrew,
  title = '스타크루 랭킹',
  rankDescription = '1인 평균풍 기준 순위',
  totalColumnLabel = '총 별풍선',
  averageColumnLabel = '1인 평균',
  totalSummaryLabel = '총합',
  averageSummaryLabel = '1인 평균풍',
  valueUnit = '개',
  formatValue = formatStars,
}) => {
  // 1인당 평균 별풍선 기준 랭킹 계산 (customRanks가 있으면 그대로 사용)
  const rankedStats: CrewRankStat[] = React.useMemo(() => {
    if (customRanks && customRanks.length > 0) {
      return customRanks;
    }
    return crews
      .map((c) => {
        const starReceivingMemberCount = c.members.filter((member) => (member.totalStars || 0) > 0).length;
        const total = c.members.reduce((sum, m) => sum + (m.totalStars || 0), 0);
        const avg = starReceivingMemberCount > 0
          ? Math.round(total / starReceivingMemberCount)
          : 0;
        return {
          crewName: c.crewName,
          memberCount: c.members.length,
          totalStars: total,
          avgStars: avg,
          rank: 0,
        };
      })
      .sort((a, b) => b.avgStars - a.avgStars || b.totalStars - a.totalStars)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [crews, customRanks]);

  const top1 = rankedStats[0];
  const top2 = rankedStats[1];
  const top3 = rankedStats[2];

  // 2분할 (1위~7위, 8위~끝)
  const half = Math.ceil(rankedStats.length / 2);
  const leftList = rankedStats.slice(0, half);
  const rightList = rankedStats.slice(half);

  const handleRowClick = (crewName: string) => {
    if (onSelectCrew) {
      onSelectCrew(crewName);
    } else {
      const el = document.getElementById(`crew-card-${crewName}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-emerald-500');
        setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500'), 2000);
      }
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-rose-600 font-black';
      case 2:
        return 'text-slate-700 font-black';
      case 3:
        return 'text-amber-600 font-black';
      case 4:
      case 5:
      case 6:
      case 7:
        return 'text-sky-600 font-bold';
      default:
        return 'text-slate-500 font-medium';
    }
  };

  const renderTable = (items: CrewRankStat[]) => (
    <div className="w-full">
      {/* 헤더 */}
      <div className="grid grid-cols-[24px_minmax(0,1fr)_36px_72px_78px] gap-x-2 sm:grid-cols-12 sm:gap-x-0 text-slate-600 text-[10px] sm:text-[13px] font-semibold py-2 px-2.5 border-b-2 border-slate-200 bg-slate-50/70 rounded-t-lg text-center">
        <span className="col-span-1 text-left sm:text-center">순위</span>
        <span className="col-span-1 sm:col-span-4 text-left">스타크루</span>
        <span className="col-span-1 sm:col-span-2 text-center">인원</span>
        <span className="col-span-1 sm:col-span-2 text-right">{totalColumnLabel}</span>
        <span className="col-span-1 sm:col-span-3 text-right">{averageColumnLabel}</span>
      </div>

      {/* 로우 리스트 */}
      <div className="divide-y divide-slate-200">
        {items.map((item) => (
          <div
            key={item.crewName}
            onClick={() => handleRowClick(item.crewName)}
            className="grid grid-cols-[24px_minmax(0,1fr)_36px_72px_78px] gap-x-2 sm:grid-cols-12 sm:gap-x-0 items-center py-2.5 px-2.5 text-[11px] sm:text-[13px] hover:bg-slate-50 cursor-pointer transition rounded-md group"
          >
            <span className={`col-span-1 text-left sm:text-center ${getRankBadgeClass(item.rank)}`}>
              {item.rank}위
            </span>
            <span className="col-span-1 sm:col-span-4 min-w-0 text-left font-bold text-slate-900 group-hover:text-emerald-600 transition truncate flex items-center gap-1 sm:gap-1.5">
              <CrewCrest crewName={item.crewName} size="md" />
              <span className="truncate">{item.crewName}</span>
            </span>
            <span className="col-span-1 sm:col-span-2 text-center text-sky-600 font-semibold tabular-nums whitespace-nowrap">
              {item.memberCount}명
            </span>
            <span className="col-span-1 sm:col-span-2 text-right font-mono font-bold text-amber-800 tabular-nums whitespace-nowrap">
              {formatValue(item.totalStars)}
            </span>
            <span className="col-span-1 sm:col-span-3 text-right font-mono font-bold text-emerald-800 tabular-nums whitespace-nowrap">
              {formatValue(item.avgStars)}{valueUnit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="w-full max-w-7xl 2xl:max-w-[1600px] flex flex-col gap-4 mb-6">
      {/* 섹션 타이틀: 스타크루 랭킹 */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              (전체 {rankedStats.length}개 팀)
            </span>
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          {rankDescription}
        </div>
      </div>

      {/* 1. 상단 TOP 3 포디움 카드 (1위, 2위, 3위) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1위 카드 */}
        {top1 && (
          <div
            onClick={() => handleRowClick(top1.crewName)}
            className="bg-white border-2 border-rose-300 hover:border-rose-500 rounded-xl p-4 sm:p-5 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-rose-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                1위
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {top1.memberCount}명
              </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 mt-1">
              <div className="flex items-center gap-3">
                <CrewCrest crewName={top1.crewName} size="xl" />
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {top1.crewName}
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    {totalSummaryLabel}: <span className="font-bold text-amber-800">{formatValue(top1.totalStars)}{valueUnit}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block mb-0.5">{averageSummaryLabel}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono leading-none">
                  {formatValue(top1.avgStars)}
                  <span className="text-sm font-bold text-slate-600 ml-1">{valueUnit}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2위 카드 */}
        {top2 && (
          <div
            onClick={() => handleRowClick(top2.crewName)}
            className="bg-white border-2 border-slate-300 hover:border-slate-500 rounded-xl p-4 sm:p-5 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-slate-700 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                2위
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {top2.memberCount}명
              </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 mt-1">
              <div className="flex items-center gap-3">
                <CrewCrest crewName={top2.crewName} size="xl" />
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {top2.crewName}
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    {totalSummaryLabel}: <span className="font-bold text-amber-800">{formatValue(top2.totalStars)}{valueUnit}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block mb-0.5">{averageSummaryLabel}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono leading-none">
                  {formatValue(top2.avgStars)}
                  <span className="text-sm font-bold text-slate-600 ml-1">{valueUnit}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3위 카드 */}
        {top3 && (
          <div
            onClick={() => handleRowClick(top3.crewName)}
            className="bg-white border-2 border-amber-300 hover:border-amber-500 rounded-xl p-4 sm:p-5 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                3위
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {top3.memberCount}명
              </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 mt-1">
              <div className="flex items-center gap-3">
                <CrewCrest crewName={top3.crewName} size="xl" />
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {top3.crewName}
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    {totalSummaryLabel}: <span className="font-bold text-amber-800">{formatValue(top3.totalStars)}{valueUnit}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block mb-0.5">{averageSummaryLabel}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono leading-none">
                  {formatValue(top3.avgStars)}
                  <span className="text-sm font-bold text-slate-600 ml-1">{valueUnit}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. 순위 모아보기 테이블 (좌/우 2열 분할) */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-3 sm:p-5 shadow-sm">
        {/* 데스크톱: 2분할 나란히 배치 */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6 divide-x-2 divide-slate-200">
          <div className="pr-3">
            {renderTable(leftList)}
          </div>
          <div className="pl-6">
            {renderTable(rightList)}
          </div>
        </div>

        {/* 모바일/태블릿: 단일 테이블 */}
        <div className="lg:hidden">
          {renderTable(rankedStats)}
        </div>
      </div>
    </section>
  );
};
