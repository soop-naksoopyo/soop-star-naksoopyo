'use client';

import React from 'react';
import { CrewCrest } from '@/components/CrewCrest';
import {
  type CalmmonTabType,
  type CalmmonStatsResult,
  type CalmmonMemberRow,
} from '@/lib/calmmonData';

interface CalmmonCardProps {
  currentTab: CalmmonTabType;
  onTabChange: (tab: CalmmonTabType) => void;
  stats: CalmmonStatsResult;
  currentDateText: string;
  sourceText?: string;
  isLiveLoading?: boolean;
}

export function CalmmonCard({
  currentTab,
  onTabChange,
  stats,
}: CalmmonCardProps) {
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
    let rowBg = 'hover:bg-slate-50 transition px-2.5 py-1.5 flex items-center justify-between rounded-lg';
    let nameColor = 'text-[13px] sm:text-sm font-bold text-slate-800';
    let valColor = 'text-[13px] sm:text-sm font-extrabold text-slate-700';

    if (item.tierBadge === 'boss' || item.isBoss) {
      rowBg = 'bg-rose-50/80 border-l-[3px] border-rose-500 px-2.5 py-1.5 flex items-center justify-between rounded-r-lg shadow-2xs';
      nameColor = 'text-[13px] sm:text-sm font-bold text-slate-900';
      valColor = 'text-[13px] sm:text-sm font-black text-rose-600';
    } else if (item.tierBadge === 'top1') {
      rowBg = 'border-l-[3px] border-blue-600 px-2.5 py-1.5 flex items-center justify-between rounded-r-lg';
      valColor = 'text-[13px] sm:text-sm font-black text-blue-600';
    } else if (item.tierBadge === 'top5') {
      rowBg = 'border-l-[3px] border-emerald-500 px-2.5 py-1.5 flex items-center justify-between rounded-r-lg';
      valColor = 'text-[13px] sm:text-sm font-extrabold text-emerald-600';
    } else if (item.tierBadge === 'top10') {
      rowBg = 'border-l-[3px] border-amber-500 px-2.5 py-1.5 flex items-center justify-between rounded-r-lg';
      valColor = 'text-[13px] sm:text-sm font-bold text-amber-600';
    }

    const defaultAvatar = `https://profile.img.sooplive.co.kr/LOGO/${item.soopId.slice(0, 2).toLowerCase()}/${item.soopId.toLowerCase()}/${item.soopId.toLowerCase()}.jpg`;

    return (
      <div key={item.soopId} className={rowBg}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1 sm:pr-1.5">
          <div className="relative shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
            <img
              src={defaultAvatar}
              alt={item.nickname}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://res.sooplive.co.kr/images/user/thumb_user.gif';
              }}
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
            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold shrink-0">
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
              <span className="text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/70">
                총 17명 · 남 6 · 여 11
              </span>
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
            ⚔️ 스폰 판수{' '}
            <span
              className={`text-[9px] px-1 py-0.2 rounded ml-0.5 ${
                currentTab === 'spon'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-200 text-amber-800'
              }`}
            >
              준비중
            </span>
          </button>
          <button
            onClick={() => onTabChange('donor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              currentTab === 'donor'
                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
            }`}
          >
            👑 후원 랭킹{' '}
            <span
              className={`text-[9px] px-1 py-0.2 rounded ml-0.5 ${
                currentTab === 'donor'
                  ? 'bg-pink-700 text-white'
                  : 'bg-pink-200 text-pink-800'
              }`}
            >
              준비중
            </span>
          </button>
        </div>
      </div>

      {/* 2-Column Grid Table */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
        {/* 남자 컬럼 (6명) */}
        <div className="p-3 sm:p-4.5">
          <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-400 pb-2 border-b border-slate-200">
            <span>남자 (6명)</span>
            <span>{getColHeader()}</span>
          </div>
          <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
            {stats.male.map(renderMemberRow)}
          </div>
        </div>

        {/* 여자 컬럼 (11명) */}
        <div className="p-3 sm:p-4.5">
          <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-400 pb-2 border-b border-slate-200">
            <span>여자 (11명)</span>
            <span>{getColHeader()}</span>
          </div>
          <div className="divide-y divide-slate-50 mt-1.5 space-y-0.5">
            {stats.female.map(renderMemberRow)}
          </div>
        </div>
      </div>

      {/* Empty State Banner for spon and donor */}
      {(currentTab === 'spon' || currentTab === 'donor') && (
        <div className="p-3 mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs sm:text-sm text-amber-800">
          💡 {currentTab === 'spon' ? '스폰 판수(Elo 전적)' : '캄몬 큰손 후원 랭킹'} 데이터는 현재 연동 준비 중입니다.
        </div>
      )}

      {/* Bottom 3-Card Summary Stats */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200 grid grid-cols-3 gap-2.5 sm:gap-3.5 text-center">
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs sm:text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
            <span>🪙</span> 전체 합계
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

      {/* Bottom Legend */}
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
    </div>
  );
}
