'use client';

import React from 'react';
import { Eye, Search, Settings } from 'lucide-react';
import { CrewCrest } from '@/components/CrewCrest';
import { CrewAffiliation } from '@/components/CrewAffiliation';
import { CrewRankSummary, type CrewRankStat } from '@/components/CrewRankSummary';
import { RankingSectionHeader } from '@/components/RankingSectionHeader';
import { ViewershipHeroStats } from '@/components/ViewershipHeroStats';
import type { ViewershipCrewSummary, ViewershipMonthlySnapshot, ViewershipStreamerSnapshot } from '@/lib/viewership';
import { summarizeViewershipCrews } from '@/lib/viewership';
import { getStaticAvatarUrl, handleAvatarError } from '@/lib/avatar';

const PAGE_SIZE = 50;

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR');
}

function formatBroadcastTime(minutes: number) {
  if (minutes <= 0) return '0분';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}분`;
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`;
}

interface ViewershipViewProps {
  yearMonth: string;
  currentMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
}

const GLOBAL_VIEWERSHIP_CACHE = new Map<string, ViewershipMonthlySnapshot>();

export const ViewershipView: React.FC<ViewershipViewProps> = ({ yearMonth, currentMonth, availableMonths, onSelectMonth }) => {
  const [snapshot, setSnapshot] = React.useState<ViewershipMonthlySnapshot | null>(
    () => GLOBAL_VIEWERSHIP_CACHE.get(yearMonth) ?? null
  );
  const [isLoading, setIsLoading] = React.useState(
    () => !GLOBAL_VIEWERSHIP_CACHE.has(yearMonth)
  );
  const [hasError, setHasError] = React.useState(false);
  const [mode, setMode] = React.useState<'crew' | 'individual'>('crew');
  const [search, setSearch] = React.useState('');
  const [crewFilter, setCrewFilter] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    setHasError(false);
    setSearch('');
    setCrewFilter('all');
    setCurrentPage(1);

    const cached = GLOBAL_VIEWERSHIP_CACHE.get(yearMonth);
    if (cached) {
      setSnapshot(cached);
      setIsLoading(false);
      if (yearMonth < currentMonth) {
        return;
      }
    } else {
      setSnapshot(null);
      setIsLoading(true);
    }

    fetch(`/api/viewership?month=${encodeURIComponent(yearMonth)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error('unavailable');
        return data as ViewershipMonthlySnapshot;
      })
      .then((data) => {
        if (!cancelled) {
          GLOBAL_VIEWERSHIP_CACHE.set(yearMonth, data);
          setSnapshot(data);
        }
      })
      .catch(() => {
        if (!cancelled && !cached) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [yearMonth, currentMonth]);

  const streamers = snapshot?.streamers ?? [];
  const crews = React.useMemo(() => summarizeViewershipCrews(streamers), [streamers]);
  const topTotalCrew = React.useMemo(() => {
    if (crews.length === 0) return undefined;
    return [...crews].sort((a, b) => b.totalViewerShip - a.totalViewerShip)[0];
  }, [crews]);
  const crewRanks: CrewRankStat[] = crews.map((crew, index) => ({
    crewName: crew.crewName,
    memberCount: crew.members.length,
    totalStars: crew.totalViewerShip,
    avgStars: crew.averageViewerShip,
    rank: index + 1,
  }));
  const totalViewerShip = streamers.reduce((sum, streamer) => sum + streamer.viewerShip, 0);
  const availableCrews = React.useMemo(() => {
    const crewSet = new Set<string>();
    streamers.forEach((s) => {
      if (s.crewName && s.crewName !== '무소속') {
        crewSet.add(s.crewName);
      }
    });
    return Array.from(crewSet).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [streamers]);

  const rankedStreamers = React.useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return [...streamers]
      .filter((streamer) => {
        if (crewFilter !== 'all') {
          const isIndep = !streamer.crewName || streamer.crewName === '무소속';
          if (crewFilter === '무소속') {
            if (!isIndep) return false;
          } else {
            if (streamer.crewName !== crewFilter) return false;
          }
        }
        if (!term) return true;
        return (
          streamer.nickname.toLocaleLowerCase().includes(term) ||
          streamer.soopId.toLocaleLowerCase().includes(term) ||
          (streamer.crewName || '무소속').toLocaleLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.viewerShip - a.viewerShip || b.averageViewers - a.averageViewers);
  }, [streamers, search, crewFilter]);
  const pageCount = Math.max(1, Math.ceil(rankedStreamers.length / PAGE_SIZE));
  const page = Math.min(currentPage, pageCount);
  const pageStreamers = rankedStreamers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="w-full max-w-7xl 2xl:max-w-[1720px] flex flex-col gap-4">
      <RankingSectionHeader
        title="월간 뷰어십 순위"
        description="뷰어십은 평균 시청자 수와 방송시간을 반영하며, 크루 순위는 활동 멤버 1인당 평균 뷰어십 기준입니다."
        icon={<Eye className="h-5 w-5 text-emerald-600" />}
        selectedMonth={yearMonth}
        availableMonths={availableMonths}
        onSelectMonth={onSelectMonth}
        mode={mode}
        onModeChange={(nextMode) => { setMode(nextMode); setCrewFilter('all'); setSearch(''); setCurrentPage(1); }}
      />

      {isLoading ? (
        <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500" role="status">
          <Settings className="h-6 w-6 animate-spin text-emerald-500" strokeWidth={1.75} />
          {yearMonth} 뷰어십 자료를 불러오는 중
        </div>
      ) : hasError || !snapshot ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-10 text-center text-sm text-amber-900">
          {yearMonth} 뷰어십 자료가 아직 없습니다.
        </div>
      ) : (
        <>
          {mode === 'crew' ? (
            <ViewershipHeroStats topCrew={crews[0]} topTotalCrew={topTotalCrew} totalViewerShip={totalViewerShip} />
          ) : null}

          {!snapshot.isClosed && yearMonth === currentMonth && snapshot.failedCount > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              일부 스트리머의 최신 뷰어십 자료를 받지 못했습니다. ({snapshot.fetchedCount}/{snapshot.requestedCount}명 수집)
            </p>
          )}

          {mode === 'crew' ? (
            <>
              <CrewRankSummary
                customRanks={crewRanks}
                title="스타크루 뷰어십 랭킹"
                rankDescription="인당 평균 뷰어십 기준 순위"
                totalColumnLabel="총 뷰어십"
                averageColumnLabel="인당 뷰어십"
                totalSummaryLabel="뷰어십"
                averageSummaryLabel="인당 뷰어십"
                valueUnit=""
                formatValue={formatNumber}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1 pt-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                  <h2 className="flex flex-wrap items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                    스타크루 명단 (1위 ~ {crews.length}위)
                    <span className="text-xs font-semibold text-slate-500 sm:text-sm">대학별 리스트</span>
                  </h2>
                </div>
                <span className="hidden text-xs font-medium text-slate-500 sm:block">인당 평균 뷰어십 기준 순위</span>
              </div>
              <CrewView crews={crews} />
            </>
          ) : (
              <IndividualView
                streamers={pageStreamers}
                search={search}
                onSearch={(value) => { setSearch(value); setCurrentPage(1); }}
                crewFilter={crewFilter}
                onCrewFilterChange={(value) => { setCrewFilter(value); setCurrentPage(1); }}
                availableCrews={availableCrews}
                currentPage={page}
                pageCount={pageCount}
                totalCount={rankedStreamers.length}
                onPageChange={setCurrentPage}
              />
          )}
        </>
      )}
    </section>
  );
};

const CrewView: React.FC<{ crews: ViewershipCrewSummary[] }> = ({ crews }) => (
  crews.length === 0 ? (
    <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">표시할 스타크루 자료가 없습니다.</div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {crews.map((crew, index) => (
        <ViewershipCrewCard key={crew.crewName} crew={crew} rank={index + 1} />
      ))}
    </div>
  )
);

const ViewershipCrewCard: React.FC<{ crew: ViewershipCrewSummary; rank: number }> = ({ crew, rank }) => {
  return (
    <article
      id={`crew-card-${crew.crewName}`}
      className="h-full overflow-hidden rounded-xl border-2 border-slate-200/90 bg-white shadow-sm flex flex-col"
    >
      <header className="border-b-2 border-slate-200 bg-slate-50/80 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 pr-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold shadow-xs ${
                  rank === 1
                    ? 'bg-rose-500 text-white'
                    : rank === 2
                    ? 'bg-slate-700 text-white'
                    : rank === 3
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {rank}위
              </span>
              <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                소속 {crew.members.length}명
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <CrewCrest crewName={crew.crewName} size="md" />
              <h3 className="truncate text-base font-bold text-slate-900 tracking-tight">{crew.crewName}</h3>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] sm:text-xs font-semibold text-slate-500">인당 뷰어십</div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-emerald-800 leading-tight">
              {formatNumber(crew.averageViewerShip)}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-slate-500">
              총 {formatNumber(crew.totalViewerShip)} · 평시 {formatNumber(crew.averageViewers)}명
            </div>
          </div>
        </div>
      </header>

      <div className="p-2 sm:p-2.5 flex-1 flex flex-col">
        {/* 1열 컬럼 헤더 */}
        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_4rem] items-center gap-1 px-2 pb-1.5 text-[10px] font-semibold text-slate-500 border-b border-slate-200 mb-1.5">
          <span>순위 · 스트리머</span>
          <span className="text-right">평균시청자</span>
          <span className="text-right">뷰어십</span>
        </div>

        <div className="flex flex-col gap-1.5 content-start flex-1">
          {crew.members.map((streamer, index) => (
            <CompactStreamerRow key={streamer.soopId} rank={index + 1} streamer={streamer} />
          ))}
        </div>
      </div>
    </article>
  );
};

const IndividualView: React.FC<{
  streamers: ViewershipStreamerSnapshot[];
  search: string;
  onSearch: (value: string) => void;
  crewFilter: string;
  onCrewFilterChange: (value: string) => void;
  availableCrews: string[];
  currentPage: number;
  pageCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}> = ({ streamers, search, onSearch, crewFilter, onCrewFilterChange, availableCrews, currentPage, pageCount, totalCount, onPageChange }) => (
  <div className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
    <div className="mb-3 flex flex-col justify-between gap-3 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 shrink-0 text-emerald-600" />
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-xl">
            전체 스트리머 뷰어십 랭킹
          </h2>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-medium text-slate-500">계산 기준:</span>
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            평균 시청자 × 방송시간(분) ÷ 60
          </span>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <select
          value={crewFilter}
          onChange={(event) => onCrewFilterChange(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white cursor-pointer max-w-[110px] sm:max-w-none"
        >
          <option value="all">전체 크루</option>
          <option value="무소속">무소속</option>
          {availableCrews.map((crew) => (
            <option key={crew} value={crew}>
              {crew}
            </option>
          ))}
        </select>
        <div className="relative min-w-0 flex-1 sm:flex-initial">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="닉네임 검색"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white sm:w-40"
          />
        </div>
        <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-mono text-slate-600">
          {totalCount}명
        </div>
      </div>
    </div>
    <div className="mb-1 grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_4rem] items-center gap-1 border-b-2 border-slate-200 bg-slate-50/80 rounded-t-lg px-2.5 py-2 text-[10px] font-semibold text-slate-600 sm:grid-cols-[minmax(0,1fr)_4rem_5rem_6rem] sm:gap-2 sm:text-xs">
      <span># · 스트리머</span>
      <span className="text-center">소속</span>
      <span className="text-right"><span className="sm:hidden">평균</span><span className="hidden sm:inline">평균 시청자</span></span>
      <span className="text-right">뷰어십</span>
    </div>
    {streamers.length === 0 ? (
      <div className="py-10 text-center text-sm text-slate-400">검색 결과가 없습니다.</div>
    ) : streamers.map((streamer, index) => (
      <IndividualRow key={streamer.soopId} rank={(currentPage - 1) * PAGE_SIZE + index + 1} streamer={streamer} />
    ))}
    {pageCount > 1 && (
      <div className="mt-3 flex items-center justify-center gap-3 border-t border-slate-100 pt-3">
        <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs disabled:opacity-40">이전</button>
        <span className="text-xs text-slate-500">{currentPage} / {pageCount}</span>
        <button type="button" disabled={currentPage >= pageCount} onClick={() => onPageChange(currentPage + 1)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs disabled:opacity-40">다음</button>
      </div>
    )}
  </div>
);

const CompactStreamerRow: React.FC<{ rank: number; streamer: ViewershipStreamerSnapshot }> = ({ rank, streamer }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_4rem] items-center gap-1 border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs rounded-lg px-2 py-1.5 transition">
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
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
      <StreamerAvatar streamer={streamer} size="small" priority={rank <= 10} />
      <a href={`https://ch.sooplive.co.kr/${streamer.soopId}`} target="_blank" rel="noopener noreferrer" className="truncate text-xs font-semibold text-slate-800 hover:text-emerald-700 min-w-0 flex-1">{streamer.nickname}</a>
      {streamer.collectionStatus === 'unavailable' && <span className="shrink-0 text-[9px] text-slate-400" title="SoopScope에서 시청 지표를 제공하지 않습니다.">조회 불가</span>}
    </div>
    <span className="whitespace-nowrap text-right text-[10px] font-semibold tabular-nums text-slate-800">{formatNumber(streamer.averageViewers)}명</span>
    <span className="whitespace-nowrap text-right text-[11px] font-bold tabular-nums text-emerald-700">{formatNumber(streamer.viewerShip)}</span>
  </div>
);

const IndividualRow: React.FC<{ rank: number; streamer: ViewershipStreamerSnapshot }> = ({ rank, streamer }) => {
  const rankBadgeClass = rank === 1
    ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    : rank === 2
      ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-300'
      : rank === 3
        ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-200'
        : 'text-slate-400';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_4rem] items-center gap-1 border-b border-slate-200 px-2.5 py-2.5 last:border-b-0 hover:bg-slate-50/80 transition sm:grid-cols-[minmax(0,1fr)_4rem_5rem_6rem] sm:gap-2 sm:py-3">
      <div className="flex min-w-0 items-center gap-1 sm:gap-3">
        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${rankBadgeClass}`}>
          {rank}
        </span>
        <StreamerAvatar streamer={streamer} priority={rank <= 10} />
        <div className="flex min-w-0 items-center gap-1.5">
          <a href={`https://ch.sooplive.co.kr/${streamer.soopId}`} target="_blank" rel="noopener noreferrer" className="truncate text-xs font-semibold text-slate-900 hover:text-emerald-700 sm:text-sm">{streamer.nickname}</a>
          {streamer.collectionStatus === 'unavailable' && <span className="shrink-0 text-[9px] text-slate-400" title="SoopScope에서 시청 지표를 제공하지 않습니다.">조회 불가</span>}
        </div>
      </div>
      <div className="flex items-center justify-center">
        <CrewAffiliation crewName={streamer.crewName} emptyLabel="-" desktopEmptyLabel="-" />
      </div>
      <div className="whitespace-nowrap text-right text-[9px] font-bold tabular-nums text-slate-900 sm:text-[11px]">{formatNumber(streamer.averageViewers)}명</div>
      <div className="whitespace-nowrap text-right text-[10px] font-bold tabular-nums text-emerald-800 sm:text-base">{formatNumber(streamer.viewerShip)}</div>
    </div>
  );
};

const StreamerAvatar: React.FC<{ streamer: ViewershipStreamerSnapshot; size?: 'small' | 'normal'; priority?: boolean }> = ({ streamer, size = 'normal' }) => (
  <img
    src={getStaticAvatarUrl(streamer.soopId)}
    alt={streamer.nickname}
    width={size === 'small' ? 28 : 32}
    height={size === 'small' ? 28 : 32}
    loading="eager"
    decoding="auto"
    onError={(event) => handleAvatarError(event, streamer.soopId, streamer.profileImageUrl)}
    className={`${size === 'small' ? 'h-7 w-7' : 'h-8 w-8'} shrink-0 rounded-full border border-slate-200 object-cover bg-slate-100`}
  />
);
