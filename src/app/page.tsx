'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { NavTabs, TabType } from '@/components/NavTabs';
import { HeroStats } from '@/components/HeroStats';
import { CrewCard } from '@/components/CrewCard';
import { RankView } from '@/components/RankView';
import { CrewRankSummary } from '@/components/CrewRankSummary';
import { RankingSectionHeader } from '@/components/RankingSectionHeader';
import { ViewershipView } from '@/components/ViewershipView';

import { OFFICIAL_STAR_CREWS } from '@/lib/starCrewsData';
import type { StreamerRowData } from '@/components/StreamerRow';
import { STAR_TIER_LEGEND } from '@/lib/calculator';
import { ARCHIVE_MONTHS } from '@/data/archiveData';
import { getCurrentMonthDate } from '@/lib/month';
import { Settings, Star } from 'lucide-react';

const archivedKeys = Object.keys(ARCHIVE_MONTHS).sort();

function getMonthRange(startMonth: string, endMonth: string) {
  const [startYear, startNumber] = startMonth.split('-').map(Number);
  const [endYear, endNumber] = endMonth.split('-').map(Number);
  const months: string[] = [];
  let year = startYear;
  let month = startNumber;

  while (year < endYear || (year === endYear && month <= endNumber)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months.reverse();
}

export default function HomePage() {
  const currentMonth = getCurrentMonthDate().slice(0, 7);
  const rankingMonths = getMonthRange(archivedKeys[0] || currentMonth, currentMonth);
  const [currentTab, setCurrentTab] = useState<TabType>('star');
  const [selectedStarMonth, setSelectedStarMonth] = useState(currentMonth);
  const previousCurrentMonth = React.useRef(currentMonth);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [starCrews, setStarCrews] = useState(OFFICIAL_STAR_CREWS);
  const [independentStreamers, setIndependentStreamers] = useState<StreamerRowData[]>([]);
  const [historicalStarCrews, setHistoricalStarCrews] = useState<typeof OFFICIAL_STAR_CREWS | null>(null);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  const [historicalMonthError, setHistoricalMonthError] = useState<'missing' | 'incomplete' | null>(null);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.starCrews?.length > 0) {
          setStarCrews(data.starCrews);
          setIndependentStreamers(Array.isArray(data.independentStreamers) ? data.independentStreamers : []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch live stats', e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 초기 로드 시 쿼리 파라미터 확인 및 동기화
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'rank') {
        setCurrentTab('rank');
      } else if (tab === 'star' || tab === 'archive') {
        setCurrentTab('star');
        if (tab === 'archive' && archivedKeys.length > 0) {
          setSelectedStarMonth(archivedKeys[archivedKeys.length - 1]);
        }
      } else if (tab === 'viewership') {
        setCurrentTab('viewership');
      }
    }
    void fetchLiveStats();
    const refreshInterval = window.setInterval(() => {
      void fetchLiveStats();
    }, 60_000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  React.useEffect(() => {
    if (previousCurrentMonth.current !== currentMonth) {
      if (selectedStarMonth === previousCurrentMonth.current) {
        setSelectedStarMonth(currentMonth);
      }
      previousCurrentMonth.current = currentMonth;
    }
  }, [currentMonth, selectedStarMonth]);

  const historicalCacheRef = React.useRef<Map<string, typeof OFFICIAL_STAR_CREWS>>(new Map());

  React.useEffect(() => {
    if (selectedStarMonth === currentMonth) {
      setHistoricalStarCrews(null);
      setHistoricalMonthError(null);
      setIsHistoricalLoading(false);
      return;
    }

    const cached = historicalCacheRef.current.get(selectedStarMonth);
    if (cached) {
      setHistoricalStarCrews(cached);
      setHistoricalMonthError(null);
      setIsHistoricalLoading(false);
      return;
    }

    let cancelled = false;
    setHistoricalStarCrews(null);
    setHistoricalMonthError(null);
    setIsHistoricalLoading(true);

    fetch(`/api/stats?month=${encodeURIComponent(selectedStarMonth)}`)
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 409) throw new Error('incomplete');
        if (!response.ok || !data.success || !Array.isArray(data.starCrews)) throw new Error('missing');
        return data.starCrews as typeof OFFICIAL_STAR_CREWS;
      })
      .then((crews) => {
        if (!cancelled) {
          historicalCacheRef.current.set(selectedStarMonth, crews);
          setHistoricalStarCrews(crews);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setHistoricalMonthError(error.message === 'incomplete' ? 'incomplete' : 'missing');
      })
      .finally(() => {
        if (!cancelled) setIsHistoricalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStarMonth, currentMonth]);

  // 전체 스타크루 통계 종합
  const allStarMembers = [
    ...starCrews.flatMap((c) => c.members.map((m) => ({ ...m, crewName: c.crewName }))),
    ...independentStreamers,
  ];
  const displayedStarCrews = selectedStarMonth === currentMonth ? starCrews : historicalStarCrews ?? [];
  const totalAllStars = displayedStarCrews.reduce(
    (sum, crew) => sum + crew.members.reduce((memberSum, member) => memberSum + member.totalStars, 0),
    0
  );

  // 1인당 평균 및 순위 재계산 (내림차순 정렬)
  const rankedCrews = React.useMemo(() => {
    return [...displayedStarCrews]
      .map((c) => {
        const total = c.members.reduce((sum, m) => sum + (m.totalStars || 0), 0);
        const starReceivingMemberCount = c.members.filter((member) => member.totalStars > 0).length;
        const avg = starReceivingMemberCount > 0
          ? Math.round(total / starReceivingMemberCount)
          : 0;
        return {
          ...c,
          total,
          avg,
        };
      })
      .sort((a, b) => b.avg - a.avg || b.total - a.total);
  }, [displayedStarCrews]);

  const topProductiveCrew = rankedCrews[0] || { crewName: '더블비', total: 0, avg: 0 };
  const topTotalCrew = [...rankedCrews].sort((a, b) => b.total - a.total)[0] || topProductiveCrew;

  if (isInitialLoading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] text-slate-900 pt-5 pb-16 px-3 sm:px-6 flex flex-col items-center selection:bg-emerald-100 selection:text-emerald-900">
        <Header />
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] flex flex-1 items-center justify-center" role="status" aria-label="스냅샷 불러오는 중">
          <Settings className="h-9 w-9 animate-spin text-emerald-500" strokeWidth={1.75} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pt-5 pb-16 px-3 sm:px-6 flex flex-col items-center selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. 상단 헤더 */}
      <Header />

      {/* 2. 메인 내비게이션 */}
      <div className="mb-4 w-full max-w-7xl 2xl:max-w-[1600px]">
        <NavTabs currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>

      {/* 4. 탭별 뷰 렌더링 */}
      {currentTab !== 'viewership' && (
        <RankingSectionHeader
          className="mb-4 w-full max-w-7xl 2xl:max-w-[1600px]"
          title="월간 별풍선 순위"
          description="스타크루별 또는 개인별 월간 별풍선 순위를 확인할 수 있습니다."
          icon={<Star className="h-5 w-5 text-emerald-600" />}
          selectedMonth={selectedStarMonth}
          availableMonths={rankingMonths}
          onSelectMonth={setSelectedStarMonth}
          mode={currentTab === 'star' ? 'crew' : 'individual'}
          onModeChange={(mode) => setCurrentTab(mode === 'crew' ? 'star' : 'rank')}
        />
      )}

      {currentTab === 'star' && (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] flex flex-col gap-6">
          {isHistoricalLoading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500" role="status">
              <Settings className="h-6 w-6 animate-spin text-emerald-500" strokeWidth={1.75} />
              {selectedStarMonth} 기록을 불러오는 중
            </div>
          ) : historicalMonthError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-900">
              {historicalMonthError === 'incomplete'
                ? '이 달의 전체 스트리머 기록이 아직 모두 저장되지 않았습니다.'
                : '이 달의 스냅샷 기록을 찾을 수 없습니다.'}
            </div>
          ) : (
            <>
          <HeroStats
            topCrewName={topTotalCrew.crewName}
            topCrewStars={topTotalCrew.total}
            topProductiveCrewName={topProductiveCrew.crewName}
            topProductiveStars={topProductiveCrew.avg}
            totalAllStars={totalAllStars}
          />

          {/* 상단 순위 모아보기 컴포넌트 */}
          <CrewRankSummary crews={displayedStarCrews} />

          {/* 개별 스타크루 명단 섹션 헤더 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-1 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                스타크루 명단 (1위 ~ {rankedCrews.length}위)
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  대학별 리스트
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">구간별 하이라이트:</span>
                {STAR_TIER_LEGEND.map((tier) => (
                  <span
                    key={tier.tier}
                    className={`px-1.5 py-0.5 rounded font-bold font-mono text-[10px] ${tier.badgeClass}`}
                  >
                    {tier.badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              대학별 소속 스트리머 현황
            </div>
          </div>

          {/* 선택 월 기준 스타크루 명단 */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rankedCrews.map((crew, idx) => (
              <CrewCard
                key={crew.crewName}
                crewName={crew.crewName}
                rank={idx + 1}
                members={crew.members}
              />
            ))}
          </div>
            </>
          )}
        </div>
      )}

      {currentTab === 'rank' && (
        <RankView
          streamers={allStarMembers}
          currentMonth={currentMonth}
          selectedMonth={selectedStarMonth}
        />
      )}

      {currentTab === 'viewership' && (
        <ViewershipView
          yearMonth={selectedStarMonth}
          currentMonth={currentMonth}
          availableMonths={rankingMonths}
          onSelectMonth={setSelectedStarMonth}
        />
      )}

    </main>
  );
}
