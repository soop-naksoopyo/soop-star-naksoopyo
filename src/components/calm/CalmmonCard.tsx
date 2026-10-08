'use client';

import React, { useRef, useState } from 'react';
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
  currentDateText,
  sourceText = '출처: 풍고 / SOOP',
  isLiveLoading = false,
}: CalmmonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopyOrCapture = async () => {
    // 텍스트 요약 클립보드 복사
    try {
      const summaryText = `[${currentDateText}] 캄몬스타즈 ${
        currentTab === 'star' ? '별풍선' : currentTab === 'time' ? '방송시간' : currentTab === 'spon' ? '스폰 판수' : '후원 랭킹'
      } 현황
- 전체 합계: ${stats.totalSumStr}
- 여자 평균: ${stats.femaleAvgStr}
- 전체 평균: ${stats.totalAvgStr}

■ 남자 (6명)
${stats.male.map((m, i) => `${i + 1}. ${m.nickname}${m.isBoss ? ' (수장)' : ''}: ${m.displayVal}`).join('\n')}

■ 여자 (11명)
${stats.female.map((f, i) => `${i + 1}. ${f.nickname}${f.isBirthday ? ' 🎂' : ''}: ${f.displayVal}`).join('\n')}
`;
      await navigator.clipboard.writeText(summaryText);
      setCopyFeedback('요약 텍스트가 복사되었습니다!');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('복사 완료');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

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
    let rowBg = 'hover:bg-slate-50 transition px-2 py-1.5 flex items-center justify-between rounded';
    let nameColor = 'font-semibold text-slate-800';
    let valColor = 'font-bold text-slate-700';

    if (item.tierBadge === 'boss' || item.isBoss) {
      rowBg = 'bg-rose-50/70 border-l-4 border-rose-500 px-2 py-1.5 flex items-center justify-between rounded';
      nameColor = 'font-bold text-slate-900';
      valColor = 'font-black text-rose-600';
    } else if (item.tierBadge === 'top1') {
      rowBg = 'border-l-4 border-blue-600 px-2 py-1.5 flex items-center justify-between rounded';
      valColor = 'font-extrabold text-blue-600';
    } else if (item.tierBadge === 'top5') {
      rowBg = 'border-l-4 border-emerald-500 px-2 py-1.5 flex items-center justify-between rounded';
      valColor = 'font-extrabold text-emerald-600';
    } else if (item.tierBadge === 'top10') {
      rowBg = 'border-l-4 border-amber-500 px-2 py-1.5 flex items-center justify-between rounded';
      valColor = 'font-bold text-amber-600';
    }

    return (
      <div key={item.soopId} className={rowBg}>
        <div className="flex items-center gap-1.5">
          <span className={nameColor}>{item.nickname}</span>
          {item.isBoss && (
            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
              수장
            </span>
          )}
          {item.isBirthday && (
            <span title="이번 달 생일 멤버!" className="cursor-help inline-flex items-center">
              🎂
            </span>
          )}
        </div>
        <span className={valColor}>{item.displayVal}</span>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden max-w-2xl mx-auto"
    >
      {/* Top Blue Accent Line */}
      <div className="h-1.5 bg-blue-600 w-full" />

      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-lg">
                🪐
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">캄몬스타즈</h2>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                총 17명 · 남 6 · 여 11
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 pl-10">
              {currentDateText} · {sourceText}
            </p>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleCopyOrCapture}
              className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            >
              <span>📋</span> 요약 복사
            </button>
            {copyFeedback && (
              <span className="text-xs text-emerald-600 font-bold animate-fade-in">
                {copyFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3 pt-2">
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
              className={`text-[10px] px-1 py-0.2 rounded ml-0.5 ${
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
              className={`text-[10px] px-1 py-0.2 rounded ml-0.5 ${
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
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 text-sm">
        {/* 남자 컬럼 (6명) */}
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-200">
            <span>남자 (6명)</span>
            <span>{getColHeader()}</span>
          </div>
          <div className="divide-y divide-slate-50 mt-1">
            {stats.male.map(renderMemberRow)}
          </div>
        </div>

        {/* 여자 컬럼 (11명) */}
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-200">
            <span>여자 (11명)</span>
            <span>{getColHeader()}</span>
          </div>
          <div className="divide-y divide-slate-50 mt-1">
            {stats.female.map(renderMemberRow)}
          </div>
        </div>
      </div>

      {/* Empty State Banner for spon and donor */}
      {(currentTab === 'spon' || currentTab === 'donor') && (
        <div className="p-4 mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800">
          💡 {currentTab === 'spon' ? '스폰 판수(Elo 전적)' : '캄몬 큰손 후원 랭킹'} 데이터는 현재 연동 준비 중입니다. 조만간 실시간 업데이트가 제공될 예정입니다!
        </div>
      )}

      {/* Bottom 3-Card Summary Stats */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1">
            <span>🪙</span> 전체 합계
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {stats.totalSumStr}
          </div>
        </div>
        <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
            <span>♀</span> 여자 평균
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 mt-1">
            {stats.femaleAvgStr}
          </div>
        </div>
        <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-center gap-1">
            <span>📊</span> 전체 평균
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-600 mt-1">
            {stats.totalAvgStr}
          </div>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-medium">
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
