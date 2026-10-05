import { Crew, StreamerWithStats, CrewStatsSummary } from '@/types/database';

/**
 * 분 단위를 소수점 1자리 시간 단위로 변환합니다.
 */
export function minutesToHours(minutes: number): number {
  if (!minutes || minutes <= 0) return 0.0;
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * 별풍선 숫자에 1,000 단위 콤마를 적용합니다.
 */
export function formatStars(stars: number | null | undefined): string {
  if (stars === null || stars === undefined) return '0';
  return Number(stars).toLocaleString('ko-KR');
}

/**
 * 시간 표시 문자열을 반환합니다.
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return '0시간';
  return `${hours}시간`;
}

/**
 * 크루 소속 멤버들의 통계를 종합하여 크루 요약 통계를 산출합니다.
 */
export function aggregateCrewStats(
  crew: Crew,
  members: StreamerWithStats[]
): CrewStatsSummary {
  let totalStars = 0;
  let totalHours = 0;

  for (const m of members) {
    if (m.stats) {
      totalStars += m.stats.total_stars || 0;
      totalHours += m.stats.broadcast_hours || 0;
    }
  }

  const starReceivingMemberCount = members.filter((member) => (member.stats?.total_stars || 0) > 0).length;
  const avgStarsPerMember = starReceivingMemberCount > 0
    ? Math.round(totalStars / starReceivingMemberCount)
    : 0;

  return {
    crew,
    members,
    totalStars,
    totalHours: Math.round(totalHours * 10) / 10,
    avgStarsPerMember,
  };
}

export type StarTier = '400k' | '300k' | '200k' | 'normal';

export interface StarTierStyle {
  tier: StarTier;
  badge: string | null;
  rowBgClass: string;
  badgeClass: string;
}

/**
 * 구간 기준(내림차순) + 구간별 스타일 설정 테이블.
 * 행 배경은 좌→우 그라데이션 + 굵은 좌측 바 + 은은한 inset 링으로
 * 라이트 배경에서도 구간이 한눈에 구분되도록 채도를 높였습니다.
 * (Tailwind JIT가 스캔할 수 있도록 클래스명은 전체 문자열로 유지)
 */
const TIER_CONFIG: ReadonlyArray<{
  tier: Exclude<StarTier, 'normal'>;
  min: number;
  badge: string;
  rowBgClass: string;
  badgeClass: string;
}> = [
  {
    tier: '400k',
    min: 400000,
    badge: '40만+',
    rowBgClass:
      'bg-gradient-to-r from-rose-100 via-rose-50 to-white border-l-[4px] border-l-rose-500 ring-1 ring-inset ring-rose-300/70 hover:from-rose-200 hover:via-rose-100 hover:to-rose-50',
    badgeClass: 'bg-rose-500 text-white border border-rose-600 shadow-xs',
  },
  {
    tier: '300k',
    min: 300000,
    badge: '30만+',
    rowBgClass:
      'bg-gradient-to-r from-violet-100 via-violet-50 to-white border-l-[4px] border-l-violet-400 ring-1 ring-inset ring-violet-200/70 hover:from-violet-200 hover:via-violet-100 hover:to-violet-50',
    badgeClass: 'bg-violet-100 text-violet-800 border border-violet-300 shadow-xs',
  },
  {
    tier: '200k',
    min: 200000,
    badge: '20만+',
    rowBgClass:
      'bg-gradient-to-r from-emerald-100 via-emerald-50 to-white border-l-[4px] border-l-emerald-400 ring-1 ring-inset ring-emerald-200/70 hover:from-emerald-200 hover:via-emerald-100 hover:to-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs',
  },
];

const NORMAL_TIER_STYLE: StarTierStyle = {
  tier: 'normal',
  badge: null,
  rowBgClass: 'hover:bg-slate-50 border-l-[4px] border-l-transparent',
  badgeClass: '',
};

/**
 * 별풍선 구간별(20만+, 30만+, 40만+) 배경 및 뱃지 스타일을 반환합니다.
 */
export function getStarTierStyle(totalStars: number | null | undefined): StarTierStyle {
  const stars = totalStars || 0;
  const matched = TIER_CONFIG.find((t) => stars >= t.min);
  if (!matched) return NORMAL_TIER_STYLE;
  const { tier, badge, rowBgClass, badgeClass } = matched;
  return { tier, badge, rowBgClass, badgeClass };
}

/** 범례(하이라이트 안내)용 구간 목록 (높은 구간 → 낮은 구간) */
export const STAR_TIER_LEGEND = TIER_CONFIG.map(({ tier, badge, badgeClass }) => ({
  tier,
  badge,
  badgeClass,
}));
