'use client';

import React from 'react';
import { ARCHIVE_MONTHS } from '@/data/archiveData';
import { formatStars } from '@/lib/calculator';
import { Trophy, Flame, Coins } from 'lucide-react';
import { CrewRankSummary } from './CrewRankSummary';
import { CrewCrest } from './CrewCrest';

interface ArchiveViewProps {
  selectedMonth: string;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ selectedMonth }) => {
  const currentArchive = ARCHIVE_MONTHS[selectedMonth] || ARCHIVE_MONTHS['2026-09'];
  const currentRanks = currentArchive.ranks;
  const currentSummary = currentArchive.summary;

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1720px] flex flex-col gap-6">
      {/* 2. 선택된 월 요약 지표 (KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">1위 스타크루</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CrewCrest crewName={currentSummary.topCrew} size="lg" />
            <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {currentSummary.topCrew}
            </div>
          </div>
          <div className="text-xs font-semibold text-amber-600 mt-0.5 tabular-nums">
            {formatStars(currentSummary.topCrewStars)}개
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">최고 평균 별풍선</span>
            <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CrewCrest crewName={currentSummary.topProductiveCrew} size="lg" />
            <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {currentSummary.topProductiveCrew}
            </div>
          </div>
          <div className="text-xs font-semibold text-orange-600 mt-0.5 tabular-nums">
            인당 {formatStars(currentSummary.topProductiveStars)}개
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">월간 누적 별풍선</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 mt-1 tabular-nums">
            {formatStars(currentSummary.totalStars)}개
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">전체 대학 합산</div>
        </div>

      </div>

      {/* 4. 순위 모아보기 컴포넌트 (해당 월 랭킹) */}
      <CrewRankSummary customRanks={currentRanks} />
    </div>
  );
};
