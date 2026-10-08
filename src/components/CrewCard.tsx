'use client';

import React from 'react';
import { StreamerRow, StreamerRowData } from './StreamerRow';
import { CrewCrest } from './CrewCrest';
import { formatStars, formatHours } from '@/lib/calculator';
import { Clock } from 'lucide-react';

interface CrewCardProps {
  crewName: string;
  category?: string;
  rank?: number;
  members: StreamerRowData[];
}

export const CrewCard: React.FC<CrewCardProps> = ({ crewName, rank, members }) => {
  const totalStars = members.reduce((sum, m) => sum + m.totalStars, 0);
  const totalHours = Math.round(members.reduce((sum, m) => sum + m.broadcastHours, 0) * 10) / 10;
  const starReceivingMemberCount = members.filter((member) => member.totalStars > 0).length;
  const avgStarsPerMember = starReceivingMemberCount > 0
    ? Math.round(totalStars / starReceivingMemberCount)
    : 0;

  const sortedMembers = [...members].sort((a, b) => b.totalStars - a.totalStars);
  const maxStars = sortedMembers[0]?.totalStars ?? 0;

  const getRankBadge = (r?: number) => {
    if (!r) return null;
    if (r === 1) return <span className="bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0">1위</span>;
    if (r === 2) return <span className="bg-slate-700 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0">2위</span>;
    if (r === 3) return <span className="bg-amber-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0">3위</span>;
    return <span className="bg-slate-100 text-sky-600 text-[11px] font-bold px-1.5 py-0.5 rounded border border-slate-200 shrink-0">{r}위</span>;
  };

  return (
    <div
      id={`crew-card-${crewName}`}
      className="bg-white rounded-xl border-2 border-slate-200/90 hover:border-slate-300 transition flex flex-col p-3 sm:p-3.5 shadow-sm scroll-mt-20 h-full"
    >
      {/* 카드 헤더: 스타크루명, 인원수, 요약 지표 */}
      <div className="flex items-start justify-between pb-2.5 border-b-2 border-slate-200 mb-2.5 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {getRankBadge(rank)}
            <CrewCrest crewName={crewName} size="md" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
              {crewName}
            </h2>
            <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              {members.length}명
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{formatHours(totalHours)}</span>
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm sm:text-base font-bold text-amber-800 tabular-nums leading-tight">
            {formatStars(totalStars)}
            <span className="text-xs text-slate-500 font-sans ml-0.5 font-normal">개</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-700 mt-0.5 font-medium whitespace-nowrap">
            인당 {formatStars(avgStarsPerMember)}개
          </div>
        </div>
      </div>

      {/* 1열 컬럼 헤더 */}
      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-semibold border-b border-slate-200 mb-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-5 text-center">#</span>
          <span>스트리머</span>
        </span>
        <span className="flex items-center gap-2">
          <span>별풍선</span>
          <span className="w-[42px] text-right">방송시간</span>
        </span>
      </div>

      {/* 스트리머 멤버 1열 리스트 배치 */}
      <div className="flex flex-col gap-1.5 content-start flex-1">
        {sortedMembers.length > 0 ? (
          sortedMembers.map((member, idx) => (
            <StreamerRow
              key={member.soopId}
              rank={idx + 1}
              data={member}
              starProgress={maxStars > 0 ? (member.totalStars / maxStars) * 100 : 0}
            />
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            표시할 스트리머가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};
