'use client';

import React, { useState } from 'react';
import { StreamerRowData } from './StreamerRow';
import { formatStars, getStarTierStyle, STAR_TIER_LEGEND } from '@/lib/calculator';
import { CrewAffiliation } from './CrewAffiliation';
import { Trophy, ArrowUpRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;

interface RankViewProps {
  streamers: (StreamerRowData & { crewName?: string })[];
  currentMonth: string;
  selectedMonth: string;
}

export const RankView: React.FC<RankViewProps> = ({ streamers, currentMonth, selectedMonth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedStreamers, setArchivedStreamers] = useState<(StreamerRowData & { crewName?: string })[] | null>(null);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState<'missing' | 'incomplete' | null>(null);

  React.useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, [selectedMonth]);

  React.useEffect(() => {
    if (selectedMonth === currentMonth) {
      setArchivedStreamers(null);
      setMonthError(null);
      setIsMonthLoading(false);
      return;
    }

    let cancelled = false;
    setArchivedStreamers(null);
    setMonthError(null);
    setIsMonthLoading(true);

    fetch(`/api/stats?month=${encodeURIComponent(selectedMonth)}`)
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 409) throw new Error('incomplete');
        if (!response.ok || !data.success || !Array.isArray(data.starCrews)) {
          throw new Error('missing');
        }
        const crewStreamers = data.starCrews.flatMap((crew: { crewName: string; members: StreamerRowData[] }) =>
          crew.members.map((member) => ({ ...member, crewName: crew.crewName }))
        ) as (StreamerRowData & { crewName?: string })[];
        const independentStreamers = Array.isArray(data.independentStreamers)
          ? data.independentStreamers as StreamerRowData[]
          : [];
        return [...crewStreamers, ...independentStreamers];
      })
      .then((rows) => {
        if (!cancelled) setArchivedStreamers(rows);
      })
      .catch((error: Error) => {
        if (!cancelled) setMonthError(error.message === 'incomplete' ? 'incomplete' : 'missing');
      })
      .finally(() => {
        if (!cancelled) setIsMonthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, currentMonth]);

  const rankedStreamers = selectedMonth === currentMonth ? streamers : archivedStreamers ?? [];

  const filtered = rankedStreamers
    .filter((s) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.nickname.toLowerCase().includes(term) ||
        s.soopId.toLowerCase().includes(term) ||
        (s.crewName && s.crewName.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => b.totalStars - a.totalStars);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, pageCount);
  const startIndex = (visiblePage - 1) * PAGE_SIZE;
  const visibleStreamers = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-5">
      {/* 랭킹 뷰 상단 컨트롤 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
              전체 스트리머 별풍선 랭킹
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-slate-500 font-medium">구간별 하이라이트:</span>
            {STAR_TIER_LEGEND.map((t) => (
              <span
                key={t.tier}
                className={`px-1.5 py-0.5 rounded font-bold font-mono text-[10px] ${t.badgeClass}`}
              >
                {t.badge}
              </span>
            ))}
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="닉네임, 크루 검색"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white w-full sm:w-44 transition"
              />
            </div>
            <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
              {filtered.length}명
            </div>
          </div>

        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 text-xs text-slate-500 font-medium border-b border-slate-100 mb-1">
        {/* 데스크톱/모바일 좌측 스트리머 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <span className="w-4 sm:w-6 text-center shrink-0">#</span>
          <span className="truncate">스트리머</span>
        </div>

        {/* 모바일/데스크톱 소속 엠블럼 열 */}
        <div className="w-10 shrink-0 text-center sm:w-16">
          <span>소속</span>
        </div>

        {/* 모바일: 2열 헤더 */}
        <div className="flex sm:hidden items-center gap-2 text-right shrink-0">
          <span className="w-[70px] text-right">별풍선</span>
          <span className="w-[76px] text-right">방송시간</span>
        </div>

        {/* 데스크톱: 2열 헤더 */}
        <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
          <span className="w-24 text-right">별풍선</span>
          <span className="w-[74px] text-right">방송</span>
        </div>
      </div>

      {/* 랭킹 리스트 */}
      <div className="divide-y divide-slate-100">
        {isMonthLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">월별 기록을 불러오는 중입니다.</div>
        ) : monthError ? (
          <div className="py-10 text-center text-sm text-slate-500">
            {monthError === 'incomplete'
              ? '이 달의 전체 스트리머 기록이 아직 모두 저장되지 않았습니다.'
              : '이 달의 스트리머 기록을 찾을 수 없습니다.'}
          </div>
        ) : visibleStreamers.map((streamer, idx) => {
          const rank = startIndex + idx + 1;
          const channelUrl = `https://ch.sooplive.co.kr/${streamer.soopId}`;
          const defaultAvatar = `https://profile.img.sooplive.co.kr/LOGO/${streamer.soopId.slice(0, 2)}/${streamer.soopId}/${streamer.soopId}.jpg`;
          const tierStyle = getStarTierStyle(streamer.totalStars);
          const formattedHours = `${Number(streamer.broadcastHours || 0).toFixed(1)}시간`;

          return (
            <div
              key={`${streamer.soopId}-${idx}`}
              className={`group flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition text-sm ${tierStyle.rowBgClass}`}
            >
              {/* 왼쪽: 순위, 아바타, 닉네임, ID */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span
                  className={`w-4 sm:w-6 text-center font-mono font-bold shrink-0 ${
                    rank === 1
                      ? 'text-rose-600 text-sm sm:text-base'
                      : rank === 2
                      ? 'text-slate-700 text-xs sm:text-sm'
                      : rank === 3
                      ? 'text-amber-600 text-xs sm:text-sm'
                      : 'text-slate-400 text-xs'
                  }`}
                >
                  {rank}
                </span>

                <img
                  src={streamer.profileImageUrl || defaultAvatar}
                  alt={streamer.nickname}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://res.sooplive.co.kr/images/user/thumb_user.gif';
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  {/* 모바일 화면 (sm 미만): 닉네임 */}
                  <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
                    <a
                      href={channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-semibold text-slate-900 transition group-hover:text-emerald-600 text-[12px]"
                      title={`${streamer.nickname} (${streamer.soopId}) 방송국 바로가기`}
                    >
                      {streamer.nickname}
                    </a>
                  </div>

                  {/* 데스크톱 화면 (sm 이상): 닉네임 */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <a
                      href={channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-800 group-hover:text-emerald-600 transition truncate text-[13.5px] flex items-center gap-0.5"
                      title={`${streamer.nickname} (${streamer.soopId}) 방송국 바로가기`}
                    >
                      <span className="truncate">{streamer.nickname}</span>
                      <ArrowUpRight className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 모바일/데스크톱 소속 엠블럼 열 */}
              <div className="flex w-10 shrink-0 items-center justify-center sm:w-16">
                <CrewAffiliation crewName={streamer.crewName} emptyLabel="-" desktopEmptyLabel="-" />
              </div>

              {/* 모바일 화면 (sm 미만): 2열 컴팩트 레이아웃 */}
              <div className="flex sm:hidden items-center gap-2 text-right shrink-0">
                <div className="w-[70px] text-right">
                  <div className="font-bold text-amber-800 tabular-nums text-xs whitespace-nowrap">
                    {formatStars(streamer.totalStars)}
                  </div>
                </div>
                <div className="w-[76px] text-right">
                  <div className="font-bold text-emerald-800 tabular-nums text-xs whitespace-nowrap">
                    {formattedHours}
                  </div>
                </div>
              </div>

              {/* 데스크톱 화면 (sm 이상): 2열 테이블 레이아웃 */}
              <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                <div className="w-24 text-right">
                  <div className="font-bold text-amber-800 font-mono tabular-nums text-sm whitespace-nowrap">
                    {formatStars(streamer.totalStars)}
                  </div>
                </div>

                <div className="w-[74px] text-right">
                  <div className="font-semibold text-slate-900 font-mono tabular-nums text-xs whitespace-nowrap">
                    {formattedHours}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
        {!isMonthLoading && !monthError && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-xs text-slate-500 sm:text-left">
            {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} / {filtered.length}명
          </span>
          <nav aria-label="스트리머 랭킹 페이지" className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(visiblePage - 1)}
              disabled={visiblePage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              이전
            </button>
            <span aria-live="polite" className="min-w-12 text-center text-xs font-semibold tabular-nums text-slate-700">
              {visiblePage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(visiblePage + 1)}
              disabled={visiblePage === pageCount}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
