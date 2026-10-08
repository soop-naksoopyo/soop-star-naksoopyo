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

export default function CalmmonPage() {
  const currentYearMonth = getCurrentMonthDate().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [currentTab, setCurrentTab] = useState<CalmmonTabType>('star');
  const [statsMap, setStatsMap] = useState<Map<string, StreamerStatInput>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('실시간');

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    setSelectedMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(Date.UTC(y, m, 1));
    setSelectedMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const fetchStats = async () => {
    try {
      const statsRes = await fetch('/api/stats');
      const newMap = new Map<string, StreamerStatInput>();

      // /api/stats 별풍선 & 방송시간 파싱
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && Array.isArray(statsData.starCrews)) {
          const calmCrew = statsData.starCrews.find((c: any) => c.crewName === '캄몬');
          if (calmCrew && Array.isArray(calmCrew.members)) {
            for (const m of calmCrew.members) {
              const prev = newMap.get(m.soopId.toLowerCase()) || {};
              newMap.set(m.soopId.toLowerCase(), {
                ...prev,
                totalStars: m.totalStars,
                broadcastHours: m.broadcastHours,
              });
            }
          }
        }
        if (statsData.timestamp) {
          const d = new Date(statsData.timestamp);
          setLastUpdatedText(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
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
  }, []);

  const statsResult = calculateCalmmonStats(statsMap, currentTab, selectedMonth);

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 pt-5 pb-16 px-3 sm:px-6 flex flex-col items-center">
      <Header />

      <div className="w-full max-w-4xl lg:max-w-5xl py-2 sm:py-4">
        {/* 상단 네비게이션 및 월 넘김 네비게이터 */}
        <div className="flex items-center justify-between mb-4">
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
              onClick={handlePrevMonth}
              aria-label="이전 달"
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
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
              onClick={handleNextMonth}
              aria-label="다음 달"
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
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

        {/* 하단 설명 안내 */}
        <div className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
          <p>
            ※ 수장 김윤환(전력외)을 포함한 캄몬스타즈 17인 전용 통계입니다.
          </p>
          <p className="mt-1">
            ※ 당월 생일 멤버에게는 닉네임 우측에 <span className="inline-block">🎂</span> 케이크 이모지가 표시됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
