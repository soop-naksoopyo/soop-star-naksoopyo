'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { CalmmonCard } from '@/components/calm/CalmmonCard';
import {
  type CalmmonTabType,
  calculateCalmmonStats,
  type StreamerStatInput,
} from '@/lib/calmmonData';
import { getCurrentMonthDate } from '@/lib/month';

// 현재 캄몬 데이터가 유효하게 존재하는 월 목록 (9월 등 과거 또는 11월 등 미래 데이터 없음 방지)
const AVAILABLE_CALMMON_MONTHS = ['2026-10'];

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
  const currentYearMonth = getCurrentMonthDate().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    AVAILABLE_CALMMON_MONTHS.includes(currentYearMonth) ? currentYearMonth : AVAILABLE_CALMMON_MONTHS[0]
  );
  const [currentTab, setCurrentTab] = useState<CalmmonTabType>('star');
  const [statsMap, setStatsMap] = useState<Map<string, StreamerStatInput>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('실시간');

  const prevMonthKey = getPrevMonthKey(selectedMonth);
  const nextMonthKey = getNextMonthKey(selectedMonth);

  const canGoPrev = AVAILABLE_CALMMON_MONTHS.includes(prevMonthKey);
  const canGoNext = AVAILABLE_CALMMON_MONTHS.includes(nextMonthKey);

  const fetchStats = async () => {
    try {
      // 1. 캄몬 전용 API 우선 호출 (Trackify 실시간 수집 + 김윤환 brainzerg7 포함 17인 전원)
      const calmRes = await fetch(`/api/calmmon?month=${selectedMonth}`);
      const newMap = new Map<string, StreamerStatInput>();

      if (calmRes.ok) {
        const calmData = await calmRes.json();
        if (calmData.success && calmData.stats) {
          for (const [id, stat] of Object.entries(calmData.stats)) {
            newMap.set(id.toLowerCase(), stat as StreamerStatInput);
          }
          if (calmData.timestamp) {
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

  const statsResult = calculateCalmmonStats(statsMap, currentTab, selectedMonth);

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 pt-3 pb-8 px-3 sm:px-6 flex flex-col items-center">
      <Header />

      <div className="w-full max-w-3xl py-2.5">
        {/* 상단 네비게이션 및 월 넘김 네비게이터 */}
        <div className="flex items-center justify-between mb-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50"
          >
            <span>←</span> 메인 대시보드
          </Link>

          {/* 월 넘김 네비게이터 */}
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
          currentDateText={`${selectedMonth.slice(0, 4)}년 ${Number(selectedMonth.slice(5))}월`}
          isLiveLoading={isLoading}
        />
      </div>
    </main>
  );
}
