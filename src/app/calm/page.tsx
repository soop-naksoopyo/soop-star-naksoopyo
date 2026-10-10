'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalmmonCard } from '@/components/calm/CalmmonCard';
import {
  type CalmmonTabType,
  calculateCalmmonStats,
  type StreamerStatInput,
  type CalmmonDonorRow,
} from '@/lib/calmmonData';
import { getCurrentMonthDate } from '@/lib/month';
import calmmonDonors from '@/data/calmmonDonors.json';

// 현재 캄몬 데이터가 유효하게 존재하는 월 목록 (2026-09 아카이브 및 2026-10 현재)
function getAvailableCalmmonMonths(): string[] {
  const currentYM = getCurrentMonthDate().slice(0, 7);
  const base = ['2026-09', '2026-10'];
  if (currentYM > '2026-10' && !base.includes(currentYM)) {
    base.push(currentYM);
  }
  return base;
}

function getPrevMonthKey(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getNextMonthKey(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function CalmmonPage() {
  const availableMonths = getAvailableCalmmonMonths();
  const currentYearMonth = getCurrentMonthDate().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths.includes(currentYearMonth) ? currentYearMonth : availableMonths[availableMonths.length - 1]
  );
  const [currentTab, setCurrentTab] = useState<CalmmonTabType>('star');
  const [statsMap, setStatsMap] = useState<Map<string, StreamerStatInput>>(new Map());
  const [donors, setDonors] = useState<CalmmonDonorRow[]>(
    () => (calmmonDonors as Record<string, CalmmonDonorRow[]>)[availableMonths.includes(currentYearMonth) ? currentYearMonth : availableMonths[availableMonths.length - 1]] || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('실시간');

  const prevMonthKey = getPrevMonthKey(selectedMonth);
  const nextMonthKey = getNextMonthKey(selectedMonth);

  const canGoPrev = availableMonths.includes(prevMonthKey);
  const canGoNext = availableMonths.includes(nextMonthKey);

  const fetchStats = async () => {
    try {
      // 1. 캄몬 전용 API 우선 호출 (Trackify 실시간 수집 + Eloboard 스폰 판수)
      const calmRes = await fetch(`/api/calmmon?month=${selectedMonth}`);
      const newMap = new Map<string, StreamerStatInput>();

      if (calmRes.ok) {
        const calmData = await calmRes.json();
        if (calmData.success && calmData.stats) {
          for (const [id, stat] of Object.entries(calmData.stats)) {
            newMap.set(id.toLowerCase(), stat as StreamerStatInput);
          }
          if (Array.isArray(calmData.donors)) {
            setDonors(calmData.donors);
          }
          if (selectedMonth === '2026-09') {
            setLastUpdatedText('2026.09.30 23:59 마감 확정');
          } else if (calmData.timestamp) {
            const d = new Date(calmData.timestamp);
            setLastUpdatedText(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
          }
        }
      }

      // 2. 보조 폴백: /api/stats (만약 calmmon API에 누락된 항목이 있을 때 보완)
      if (newMap.size < 17) {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success && Array.isArray(statsData.starCrews)) {
            const calmCrew = statsData.starCrews.find((c: any) => c.crewName === '캄몬');
            if (calmCrew && Array.isArray(calmCrew.members)) {
              for (const m of calmCrew.members) {
                const key = m.soopId.toLowerCase();
                if (!newMap.has(key)) {
                  newMap.set(key, {
                    totalStars: m.totalStars,
                    broadcastHours: m.broadcastHours,
                  });
                }
              }
            }
          }
        }
      }

      if (newMap.size > 0) {
        setStatsMap(newMap);
      }
    } catch (e) {
      console.error('Failed to fetch Calmmon live stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [selectedMonth]);

  useEffect(() => {
    document.title = '캄몬스타즈 대시보드';
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    const prevIcon = link?.href;
    if (link) {
      link.href = '/crests/26.png';
    } else {
      link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/crests/26.png';
      document.head.appendChild(link);
    }

    return () => {
      if (link && prevIcon) {
        link.href = prevIcon;
      }
    };
  }, []);

  const statsResult = calculateCalmmonStats(statsMap, currentTab, selectedMonth);

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 pt-6 sm:pt-10 pb-12 px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-3xl py-2.5">
        {/* 월 넘김 네비게이터 */}
        <div className="flex items-center justify-end mb-2.5">
          <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-full px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={() => canGoPrev && setSelectedMonth(prevMonthKey)}
              disabled={!canGoPrev}
              aria-label="이전 달"
              title={canGoPrev ? "이전 달" : "9월 데이터는 준비 중입니다"}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs sm:text-sm font-bold text-slate-800 select-none">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {selectedMonth.slice(0, 4)}년 {Number(selectedMonth.slice(5))}월
              </span>
            </div>
            <button
              type="button"
              onClick={() => canGoNext && setSelectedMonth(nextMonthKey)}
              disabled={!canGoNext}
              aria-label="다음 달"
              title={canGoNext ? "다음 달" : "11월 데이터는 아직 없습니다"}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 캄몬 메인 카드 */}
        <CalmmonCard
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          stats={statsResult}
          donors={donors}
          currentDateText={`${selectedMonth.slice(0, 4)}년 ${Number(selectedMonth.slice(5))}월`}
          isLiveLoading={isLoading}
        />
      </div>
    </main>
  );
}
