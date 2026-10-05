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
    if (r === 1) return <span className="bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">1위</span>;
    if (r === 2) return <span className="bg-slate-700 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">2위</span>;
    if (r === 3) return <span className="bg-amber-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">3위</span>;
    return <span className="bg-slate-100 text-sky-600 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">{r}위</span>;
  };

  return (
    <div
      id={`crew-card-${crewName}`}
      className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 transition flex flex-col p-4 shadow-xs scroll-mt-20"
    >
      {/* 카드 헤더: 스타크루명, 인원수, 요약 지표 */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-2.5">
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
          <div className="text-[11px] text-slate-700 mt-0.5">
            인당 {formatStars(avgStarsPerMember)}개
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-slate-500 font-medium border-b border-slate-100 mb-1">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
          <span className="w-4 text-center shrink-0">#</span>
          <span className="truncate">스트리머</span>
        </div>
        <div className="flex items-center gap-2 text-right shrink-0">
          <span className="w-[74px] text-right">별풍선</span>
          <span className="w-[74px] text-right">방송시간</span>
        </div>
      </div>

      <div className="overflow-hidden flex-1">
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
