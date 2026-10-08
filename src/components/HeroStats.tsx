import React from 'react';
import { formatStars } from '@/lib/calculator';
import { CrewCrest } from './CrewCrest';
import { Trophy, Flame, Coins } from 'lucide-react';

interface HeroStatsProps {
  topCrewName: string;
  topCrewStars: number;
  topProductiveCrewName: string;
  topProductiveStars: number;
  totalAllStars: number;
}

export const HeroStats: React.FC<HeroStatsProps> = ({
  topCrewName,
  topCrewStars,
  topProductiveCrewName,
  topProductiveStars,
  totalAllStars,
}) => {
  return (
    <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
      {/* 1. 이달의 1위 스타크루 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 shadow-xs hover:shadow-sm transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">1위 스타크루</span>
          <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <CrewCrest crewName={topCrewName} size="lg" />
          <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {topCrewName}
          </div>
        </div>
        <div className="text-xs font-semibold text-amber-600 mt-0.5 tabular-nums">
          {formatStars(topCrewStars)}개
        </div>
      </div>

      {/* 2. 1인당 최고 화력 크루 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 shadow-xs hover:shadow-sm transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">최고 평균 별풍선</span>
          <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <CrewCrest crewName={topProductiveCrewName} size="lg" />
          <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {topProductiveCrewName}
          </div>
        </div>
        <div className="text-xs font-semibold text-orange-600 mt-0.5 tabular-nums">
          인당 {formatStars(topProductiveStars)}개
        </div>
      </div>

      {/* 3. 전체 누적 별풍선 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 shadow-xs hover:shadow-sm transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">전체 누적 별풍선</span>
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Coins className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-base sm:text-lg font-black text-emerald-600 mt-1 tabular-nums">
          {formatStars(totalAllStars)}개
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">실시간 합산 별풍선</div>
      </div>

    </div>
  );
};
