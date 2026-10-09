import React from 'react';
import { Coins, Flame, Trophy } from 'lucide-react';
import { CrewCrest } from '@/components/CrewCrest';
import type { ViewershipCrewSummary } from '@/lib/viewership';

interface ViewershipHeroStatsProps {
  topCrew?: ViewershipCrewSummary;
  topTotalCrew?: ViewershipCrewSummary;
  totalViewerShip: number;
}

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR');
}

export const ViewershipHeroStats: React.FC<ViewershipHeroStatsProps> = ({ topCrew, topTotalCrew, totalViewerShip }) => {
  const primaryTopTotal = topTotalCrew || topCrew;

  return (
    <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
      <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">1위 스타크루</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
            <Trophy className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {topCrew && <CrewCrest crewName={topCrew.crewName} size="lg" />}
          <div className="truncate text-base font-bold text-slate-900 sm:text-lg">{topCrew?.crewName ?? '기록 없음'}</div>
        </div>
        <div className="mt-0.5 text-xs font-semibold tabular-nums text-amber-600">
          {topCrew ? `인당 뷰어십 ${formatNumber(topCrew.averageViewerShip)}` : '집계된 스타크루가 없습니다.'}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">최고 총 뷰어십</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-600">
            <Flame className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {primaryTopTotal && <CrewCrest crewName={primaryTopTotal.crewName} size="lg" />}
          <div className="truncate text-base font-bold text-slate-900 sm:text-lg">{primaryTopTotal?.crewName ?? '기록 없음'}</div>
        </div>
        <div className="mt-0.5 text-xs font-semibold tabular-nums text-orange-600">
          {primaryTopTotal ? `총 뷰어십 ${formatNumber(primaryTopTotal.totalViewerShip)}` : '집계된 총 뷰어십이 없습니다.'}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:shadow-sm sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">전체 누적 뷰어십</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
            <Coins className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1 text-base font-black tabular-nums text-emerald-600 sm:text-lg">{formatNumber(totalViewerShip)}</div>
        <div className="mt-0.5 text-[11px] font-medium text-slate-500">평균 시청자 × 방송시간 합산</div>
      </div>
    </div>
  );
};
