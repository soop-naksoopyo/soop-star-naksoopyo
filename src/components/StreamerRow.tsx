import React from 'react';
import { formatStars, formatHours, getStarTierStyle } from '@/lib/calculator';

export interface StreamerRowData {
  soopId: string;
  nickname: string;
  profileImageUrl?: string | null;
  totalStars: number;
  broadcastHours: number;
  collectionStatus?: 'available' | 'unavailable';
}

interface StreamerRowProps {
  rank: number;
  data: StreamerRowData;
  starProgress: number;
}

export const StreamerRow: React.FC<StreamerRowProps> = ({ rank, data, starProgress }) => {
  const { soopId, nickname, profileImageUrl, totalStars, broadcastHours, collectionStatus } = data;
  const channelUrl = `https://ch.sooplive.co.kr/${soopId}`;
  const defaultAvatar = `https://profile.img.sooplive.co.kr/LOGO/${soopId.slice(0, 2)}/${soopId}/${soopId}.jpg`;
  const tierStyle = getStarTierStyle(totalStars);

  return (
    <div
      className={`group flex items-center justify-between py-1.5 px-2 rounded-lg transition duration-150 border-b border-slate-100 last:border-b-0 text-sm ${tierStyle.rowBgClass}`}
    >
      {/* 1. 순위, 2. 프로필 아바타, 3. 닉네임 */}
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold ${
            rank === 1
              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
              : rank === 2
              ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-300'
              : rank === 3
              ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-200'
              : 'text-slate-400'
          }`}
        >
          {rank}
        </span>

        <img
          src={profileImageUrl || defaultAvatar}
          alt={nickname}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://res.sooplive.co.kr/images/user/thumb_user.gif';
          }}
          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
        />

        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-slate-800 group-hover:text-emerald-600 truncate transition min-w-0 flex-1"
          title={`${nickname} (${soopId}) 방송국 바로가기`}
        >
          {nickname}
        </a>
        {collectionStatus && collectionStatus !== 'available' && (
          <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-500" title="SoopScope에서 이 스트리머의 월간 데이터를 제공하지 않습니다.">
            조회 불가
          </span>
        )}
      </div>

      {/* 4. 누적 별풍선, 5. 방송시간 */}
      <div className="flex items-center gap-2 text-right shrink-0">
        <div className="w-[74px] text-right">
          <div className="font-bold text-amber-800 tabular-nums text-xs whitespace-nowrap">
            {formatStars(totalStars)}
          </div>
          <div
            className="mt-1 h-1 w-full overflow-hidden rounded-full bg-amber-100"
            role="meter"
            aria-label={`${nickname} 별풍선 순위 막대`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(starProgress)}
          >
            <div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${starProgress}%` }} />
          </div>
        </div>
        <div className="w-[74px] text-right">
          <div className="font-semibold text-slate-900 tabular-nums text-xs whitespace-nowrap">
            {formatHours(broadcastHours)}
          </div>
        </div>
      </div>
    </div>
  );
};
