'use client';

import React from 'react';
import { CrewCrest } from '@/components/CrewCrest';
import { getStaticAvatarUrl, handleAvatarError } from '@/lib/avatar';
import {
  type CalmmonTabType,
  type CalmmonStatsResult,
  type CalmmonMemberRow,
  type CalmmonDonorRow,
} from '@/lib/calmmonData';

interface CalmmonCardProps {
  currentTab: CalmmonTabType;
  onTabChange: (tab: CalmmonTabType) => void;
  stats: CalmmonStatsResult;
  currentDateText: string;
  sourceText?: string;
  isLiveLoading?: boolean;
  donors?: CalmmonDonorRow[];
}

export function CalmmonCard({
  currentTab,
  onTabChange,
  stats,
  donors = [],
}: CalmmonCardProps) {
  const top100Donors = React.useMemo(() => (donors || []).slice(0, 100), [donors]);
  const [donorPage, setDonorPage] = React.useState(1);
  const donorPageSize = 20;

  const totalDonorPages = Math.max(1, Math.ceil(top100Donors.length / donorPageSize));
  const safeDonorPage = Math.min(Math.max(1, donorPage), totalDonorPages);

  React.useEffect(() => {
    setDonorPage(1);
  }, [currentTab]);

  const pageDonors = top100Donors.slice((safeDonorPage - 1) * donorPageSize, safeDonorPage * donorPageSize);
  const leftDonors = pageDonors.slice(0, 10);
  const rightDonors = pageDonors.slice(10, 20);

  const leftStartRank = (safeDonorPage - 1) * donorPageSize + 1;
  const leftEndRank = (safeDonorPage - 1) * donorPageSize + leftDonors.length;
  const rightStartRank = leftEndRank + 1;
  const rightEndRank = (safeDonorPage - 1) * donorPageSize + pageDonors.length;


  const getColHeader = () => {
    switch (currentTab) {
      case 'star': return '별풍선';
      case 'time': return '방송시간';
      case 'spon': return '스폰판수';
      case 'donor': return '후원 별풍';
      default: return '수치';
    }
  };

  const renderMemberRow = (item: CalmmonMemberRow) => {
    let rowBg = 'hover:bg-slate-50 transition px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-lg';
    let nameColor = 'text-[13px] sm:text-sm font-bold text-slate-800';
    let valColor = 'text-[13px] sm:text-sm font-extrabold text-slate-700';

    if (item.tierBadge === 'boss' || item.isBoss) {
      rowBg = 'bg-rose-50/80 border-l-[3px] border-rose-500 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg shadow-2xs';
      nameColor = 'text-[13px] sm:text-sm font-bold text-slate-900';
      valColor = 'text-[13px] sm:text-sm font-black text-rose-600';
    } else if (item.tierBadge === 'top1') {
      rowBg = 'border-l-[3px] border-blue-600 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg';
      valColor = 'text-[13px] sm:text-sm font-black text-blue-600';
    } else if (item.tierBadge === 'top5') {
      rowBg = 'border-l-[3px] border-emerald-500 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg';
      valColor = 'text-[13px] sm:text-sm font-extrabold text-emerald-600';
    } else if (item.tierBadge === 'top10') {
      rowBg = 'border-l-[3px] border-amber-500 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg';
      valColor = 'text-[13px] sm:text-sm font-bold text-amber-600';
    }

    const defaultAvatar = getStaticAvatarUrl(item.soopId);

    return (
      <div key={item.soopId} className={rowBg}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1 sm:pr-1.5">
          <div className="relative shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
            <img
              src={defaultAvatar}
              alt={item.nickname}
              width={28}
              height={28}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(e) => handleAvatarError(e, item.soopId)}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0 bg-slate-100 transition shadow-2xs ${
                item.isLive
                  ? 'ring-2 ring-[#00c7ff] border-2 border-white'
                  : 'border border-slate-200'
              }`}
            />
            {item.isLive && (
              <span
                title="SOOP 생방송 진행 중"
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#00c7ff] ring-2 ring-white shadow-2xs"
              />
            )}
          </div>
          <a
            href={`https://ch.sooplive.co.kr/${item.soopId}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`${item.nickname} SOOP 방송국 바로가기${item.isLive ? ' (생방송 진행 중)' : ''}`}
            className="truncate hover:underline flex items-center"
          >
            <span className={nameColor}>{item.nickname}</span>
          </a>
          {item.isBoss && (
            <span className="text-[9px] sm:text-[10px] bg-rose-100 text-rose-700 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded font-bold shrink-0">
              수장
            </span>
          )}
          {item.isBirthday && (
            <span title="이번 달 생일 멤버!" className="cursor-help inline-flex items-center text-sm shrink-0">
              🎂
            </span>
          )}
        </div>
        <span className={`${valColor} shrink-0`}>{item.displayVal}</span>
      </div>
    );
  };

  const renderDonorRow = (donor: CalmmonDonorRow) => {
    const isTop1 = donor.rank === 1;
    const isTop2 = donor.rank === 2;
    const isTop3 = donor.rank === 3;

    let rowBg = 'hover:bg-slate-50 transition px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-lg';
    let valColor = 'text-xs sm:text-sm font-extrabold text-slate-800';

    if (isTop1) {
      rowBg = 'bg-amber-50/70 border-l-[3px] border-amber-500 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg shadow-2xs';
      valColor = 'text-xs sm:text-sm font-black text-amber-600';
    } else if (isTop2) {
      rowBg = 'bg-slate-50/80 border-l-[3px] border-slate-400 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg shadow-2xs';
      valColor = 'text-xs sm:text-sm font-black text-slate-700';
    } else if (isTop3) {
      rowBg = 'bg-amber-50/40 border-l-[3px] border-amber-700 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-between rounded-r-lg shadow-2xs';
      valColor = 'text-xs sm:text-sm font-black text-amber-800';
    }

    const avatarSrc = donor.profileImage || `https://profile.img.sooplive.co.kr/LOGO/${donor.userId.slice(0, 2)}/${donor.userId}/${donor.userId}.jpg`;

    return (
      <div key={donor.userId} className={rowBg}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1 sm:pr-1.5 flex-1">
          <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-bold shrink-0 select-none">
            {isTop1 ? '👑' : isTop2 ? '🥈' : isTop3 ? '🥉' : (
              <span className="text-slate-400 font-bold">{donor.rank}</span>
            )}
          </span>
          <div className="relative shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 shadow-2xs overflow-hidden">
            <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-100 select-none">
              {donor.userNick.slice(0, 1)}
            </span>
            <img
              src={avatarSrc}
              alt={donor.userNick}
              width={28}
              height={28}
              loading="lazy"
              className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col min-w-0 pr-1 leading-tight">
            <a
              href={`https://ch.sooplive.co.kr/${donor.userId}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`${donor.userNick} (@${donor.userId})`}
              className="text-[12px] sm:text-[13px] font-bold text-slate-900 hover:text-blue-600 truncate hover:underline"
            >
              {donor.userNick}
            </a>
            {donor.primaryStreamer && (
              <div
                title={`주 후원: ${donor.primaryStreamer}`}
                className="flex items-center gap-1 text-[10px] text-slate-500 font-medium select-none"
              >
                <span className="text-slate-400 text-[9px]">주후원:</span>
                {donor.primaryStreamerId ? (
                  <img
                    src={getStaticAvatarUrl(donor.primaryStreamerId)}
                    alt={donor.primaryStreamer}
                    width={12}
                    height={12}
                    loading="lazy"
                    onError={(e) => handleAvatarError(e, donor.primaryStreamerId!)}
                    className="w-3 h-3 rounded-full object-cover shrink-0 border border-slate-300 shadow-2xs"
                  />
                ) : null}
                <span className="font-semibold text-slate-700">
                  {donor.primaryStreamer}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`shrink-0 text-right ${valColor}`}>
          {donor.balloonCount > 0 ? `${donor.balloonCount.toLocaleString()}개` : '-'}
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-3xl mx-auto"
    >
      {/* Top Blue Accent Line */}
      <div className="h-1 bg-blue-600 w-full" />

      {/* Card Header */}
      <div className="p-3 sm:p-3.5 pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <CrewCrest crewName="캄몬" size="md" className="shadow-2xs" />
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">캄몬스타즈</h2>
              {currentTab === 'donor' ? (
                <span className="text-[10px] sm:text-xs font-semibold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200/70">
                  후원 랭킹 · TOP 100 ({safeDonorPage}/{totalDonorPages}P)
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/70">
                  총 17명 · 남 6 · 여 11
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 pt-0.5">
          <button
            onClick={() => onTabChange('star')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              currentTab === 'star'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎈 별풍선
          </button>
          <button
            onClick={() => onTabChange('time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              currentTab === 'time'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⏱️ 방송시간
          </button>
          <button
            onClick={() => onTabChange('spon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              currentTab === 'spon'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            ⚔️ 스폰 판수
          </button>
          <button
            onClick={() => onTabChange('donor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              currentTab === 'donor'
                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
            }`}
          >
            👑 후원 랭킹
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {currentTab === 'donor' ? (
        /* 시청자(큰손) 후원 랭킹 전용 뷰: 방송시간/스폰 판수처럼 2열(2줄) 컴팩트 그리드 */
        <div className="border-t border-slate-100">
          {top100Donors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              후원자 데이터가 없습니다.
            </div>
          ) : (
            <>
              {/* 모바일 1열 뷰: 풀 너비로 닉네임, 스트리머 이름, 별풍선이 짤림 없이 선명하게 표시 */}
              <div className="block md:hidden p-2.5 sm:p-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-200 px-2 sm:px-2.5">
                  <span>{(safeDonorPage - 1) * donorPageSize + 1}~{(safeDonorPage - 1) * donorPageSize + pageDonors.length}위</span>
                  <span className="text-right">{getColHeader()}</span>
                </div>
                <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
                  {pageDonors.map(renderDonorRow)}
                </div>
              </div>

              {/* 데스크톱 2열 컴팩트 그리드: 좌10명 / 우10명 규격 유지 */}
              <div className="hidden md:grid md:grid-cols-2 divide-x divide-slate-100">
                {/* 왼쪽 컬럼 (앞 10명) */}
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-400 pb-2 border-b border-slate-200 px-2 sm:px-2.5">
                    <span>{leftStartRank}~{leftEndRank}위</span>
                    <span className="text-right">{getColHeader()}</span>
                  </div>
                  <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
                    {leftDonors.map(renderDonorRow)}
                  </div>
                </div>

                {/* 오른쪽 컬럼 (뒤 10명) */}
                <div className="p-3 sm:p-4">
                  {rightDonors.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-400 pb-2 border-b border-slate-200 px-2 sm:px-2.5">
                        <span>{rightStartRank}~{rightEndRank}위</span>
                        <span className="text-right">{getColHeader()}</span>
                      </div>
                      <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
                        {rightDonors.map(renderDonorRow)}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-300">
                      -
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {totalDonorPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 py-2.5 px-3 sm:px-6 bg-white">
              <button
                type="button"
                onClick={() => setDonorPage((p) => Math.max(1, p - 1))}
                disabled={safeDonorPage <= 1}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ◀ 이전
              </button>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {Array.from({ length: totalDonorPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDonorPage(num)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 text-xs font-black rounded-lg transition cursor-pointer shrink-0 ${
                      safeDonorPage === num
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDonorPage((p) => Math.min(totalDonorPages, p + 1))}
                disabled={safeDonorPage >= totalDonorPages}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                다음 ▶
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 기존 2-Column Grid Table (남자 / 여자) */
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
          {/* 남자 컬럼 (6명) */}
          <div className="p-2 sm:p-4.5">
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-400 pb-2 border-b border-slate-200">
              <span>남자 (6명)</span>
              <span>{getColHeader()}</span>
            </div>
            <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
              {stats.male.map(renderMemberRow)}
            </div>
          </div>

          {/* 여자 컬럼 (11명) */}
          <div className="p-2 sm:p-4.5">
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-400 pb-2 border-b border-slate-200">
              <span>여자 (11명)</span>
              <span>{getColHeader()}</span>
            </div>
            <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
              {stats.female.map(renderMemberRow)}
            </div>
          </div>
        </div>
      )}

      {/* Bottom 3-Card Summary Stats */}
      {currentTab !== 'donor' && (
        <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200 grid grid-cols-3 gap-2.5 sm:gap-3.5 text-center">
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="text-xs sm:text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
              <span>{currentTab === 'spon' ? '⚔️' : currentTab === 'time' ? '⏱️' : '🪙'}</span> 전체 합계
            </div>
            <div className="text-base sm:text-lg md:text-xl font-black text-slate-900 mt-1">
              {stats.totalSumStr}
            </div>
          </div>
          <div className="bg-emerald-50/70 p-2.5 sm:p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="text-xs sm:text-[13px] font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
              <span>♀</span> 여자 평균
            </div>
            <div className="text-base sm:text-lg md:text-xl font-black text-emerald-600 mt-1">
              {stats.femaleAvgStr}
            </div>
          </div>
          <div className="bg-indigo-50/70 p-2.5 sm:p-3 rounded-xl border border-indigo-200/80 shadow-2xs">
            <div className="text-xs sm:text-[13px] font-semibold text-indigo-700 flex items-center justify-center gap-1.5">
              <span>📊</span> 전체 평균
            </div>
            <div className="text-base sm:text-lg md:text-xl font-black text-indigo-600 mt-1">
              {stats.totalAvgStr}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Legend or Footer */}
      {currentTab !== 'donor' ? (
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5 font-bold text-sky-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00c7ff] ring-2 ring-sky-200 shadow-2xs" /> 방송 중 (ON)
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" /> 상위 1%
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> 상위 5%
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> 상위 10%
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" /> 수장/전력외
          </div>
          <div className="flex items-center gap-1">
            <span>🎂</span> 이번 달 생일
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 text-center text-[11px] sm:text-xs text-slate-400 font-medium">
          💡 캄몬스타즈 17개 방송국 후원 데이터 기반 큰손 후원 랭킹 (TOP 100)
        </div>
      )}
    </div>
  );
}
