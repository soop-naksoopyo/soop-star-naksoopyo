'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  const [currentTab, setCurrentTab] = useState<CalmmonTabType>('star');
  const [statsMap, setStatsMap] = useState<Map<string, StreamerStatInput>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedText, setLastUpdatedText] = useState('실시간');

  const fetchStats = async () => {
    try {
      const [statsRes, viewRes] = await Promise.allSettled([
        fetch('/api/stats'),
        fetch('/api/viewership?month=' + currentYearMonth),
      ]);

      const newMap = new Map<string, StreamerStatInput>();

      // 1. /api/stats 별풍선 & 방송시간 파싱
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
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

      // 2. /api/viewership 뷰어십 데이터 파싱
      if (viewRes.status === 'fulfilled' && viewRes.value.ok) {
        const viewData = await viewRes.value.json();
        const streamers = viewData?.snapshot?.streamers || viewData?.streamers;
        if (Array.isArray(streamers)) {
          for (const s of streamers) {
            const key = s.soopId.toLowerCase();
            const prev = newMap.get(key) || {};
            newMap.set(key, {
              ...prev,
              averageViewers: s.averageViewers || s.peakViewers || prev.averageViewers,
            });
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
  }, []);

  const statsResult = calculateCalmmonStats(statsMap, currentTab, currentYearMonth);

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 pt-5 pb-16 px-3 sm:px-6 flex flex-col items-center">
      <Header />

      <div className="w-full max-w-2xl py-2 sm:py-4">
        {/* 상단 빵부스러기 및 이동 링크 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
            >
              <span>←</span> 메인 스타크루 대시보드
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              캄몬스타즈 전용 뷰 (/calm)
            </span>
          </div>

          <div className="text-xs text-slate-400">
            {currentYearMonth.slice(2, 4)}년 {currentYearMonth.slice(5, 7)}월 기준
          </div>
        </div>

        {/* 캄몬 메인 카드 */}
        <CalmmonCard
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          stats={statsResult}
          currentDateText={`${currentYearMonth.slice(2, 4)}년 ${currentYearMonth.slice(5, 7)}월`}
          sourceText={`업데이트: ${lastUpdatedText} · 출처: 풍고 / SOOP`}
          isLiveLoading={isLoading}
        />

        {/* 하단 설명 안내 */}
        <div className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
          <p>
            ※ 수장 김윤환(전력외)을 포함한 캄몬스타즈 17명 전체 통계입니다.
          </p>
          <p className="mt-1">
            ※ 생일인 멤버에게는 닉네임 우측에 <span className="inline-block">🎂</span> 케이크 이모지가 자동으로 표시됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
