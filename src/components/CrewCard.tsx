'use client';

import React from 'react';
import { StreamerRow, StreamerRowData } from './StreamerRow';
import { CrewCrest } from './CrewCrest';
import { formatStars, formatHours } from '@/lib/calculator';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface CrewCardProps {
  crewName: string;
  category?: string;
  rank?: number;
  members: StreamerRowData[];
}

export const CrewCard: React.FC<CrewCardProps> = ({ crewName, rank, members }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const INITIAL_LIMIT = 10;

  const totalStars = members.reduce((sum, m) => sum + m.totalStars, 0);
  const totalHours = Math.round(members.reduce((sum, m) => sum + m.broadcastHours, 0) * 10) / 10;
  const starReceivingMemberCount = members.filter((member) => member.totalStars > 0).length;
  const avgStarsPerMember = starReceivingMemberCount > 0
    ? Math.round(totalStars / starReceivingMemberCount)
    : 0;

  const sortedMembers = [...members].sort((a, b) => b.totalStars - a.totalStars);
  const maxStars = sortedMembers[0]?.totalStars ?? 0;
  const hasMore = sortedMembers.length > INITIAL_LIMIT;
  const displayMembers = isExpanded ? sortedMembers : sortedMembers.slice(0, INITIAL_LIMIT);

  const getRankBadge = (r?: number) => {
    if (!r) return null;
    if (r === 1) return <span className="bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">1위</span>;
    if (r === 2) return <span className="bg-slate-700 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">2위</span>;
    if (r === 3) return <span className="bg-amber-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">3위</span>;
    return <span className="bg-slate-100 text-sky-600 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">{r}위</span>;
  };

  return (
    <div
      id={`crew-card-${crewName}`}
      className="bg-white rounded-xl border-2 border-slate-200/90 hover:border-slate-300 transition flex flex-col p-4 shadow-sm scroll-mt-20"
    >
      {/* 카드 헤더: 스타크루명, 인원수, 요약 지표 */}
      <div className="flex items-start justify-between pb-3 border-b-2 border-slate-200 mb-3">
        <div>
          <div className="flex items-center gap-2">
            {getRankBadge(rank)}
            <CrewCrest crewName={crewName} size="md" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {crewName}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {members.length}명
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatHours(totalHours)}</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-base font-bold text-amber-800 tabular-nums leading-tight">
            {formatStars(totalStars)}
            <span className="text-xs text-slate-500 font-sans ml-0.5 font-normal">개</span>
          </div>
          <div className="text-[11px] text-slate-700 mt-0.5 font-medium">
            인당 {formatStars(avgStarsPerMember)}개
          </div>
        </div>
      </div>

      {/* 2열 컬럼 헤더 (데스크톱) / 1열 헤더 (모바일) */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-2 px-1 py-1 text-[11px] text-slate-500 font-semibold border-b border-slate-200 mb-2">
        <div className="flex items-center justify-between px-2">
          <span className="flex items-center gap-2">
            <span className="w-5 text-center">#</span>
            <span>스트리머</span>
          </span>
          <span className="flex items-center gap-3">
            <span>별풍선</span>
            <span className="w-[46px] text-right">방송시간</span>
          </span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="flex items-center gap-2">
            <span className="w-5 text-center">#</span>
            <span>스트리머</span>
          </span>
          <span className="flex items-center gap-3">
            <span>별풍선</span>
            <span className="w-[46px] text-right">방송시간</span>
          </span>
        </div>
      </div>
      <div className="sm:hidden flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-semibold border-b border-slate-200 mb-2">
        <span className="flex items-center gap-2">
          <span className="w-5 text-center">#</span>
          <span>스트리머</span>
        </span>
        <span className="flex items-center gap-3">
          <span>별풍선</span>
          <span className="w-[46px] text-right">방송시간</span>
        </span>
      </div>

      {/* 스트리머 멤버 2열 그리드 배치 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
        {displayMembers.length > 0 ? (
          displayMembers.map((member, idx) => (
            <StreamerRow
              key={member.soopId}
              rank={idx + 1}
              data={member}
              starProgress={maxStars > 0 ? (member.totalStars / maxStars) * 100 : 0}
            />
          ))
        ) : (
          <div className="col-span-full py-6 text-center text-xs text-slate-400">
            표시할 스트리머가 없습니다.
          </div>
        )}
      </div>

      {/* 10명 초과 시 더보기 / 접기 토글 */}
      {hasMore && (
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition border border-slate-200 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>접기 (상위 10명만 보기)</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              </>
            ) : (
              <>
                <span>전체 {sortedMembers.length}명 모두 보기 (+{sortedMembers.length - INITIAL_LIMIT}명)</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
