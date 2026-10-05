import { Streamer, MonthlyAggregate } from '@/types/database';
import { SoopScopeStreamerRow } from './collector';
import { minutesToHours } from './calculator';

export interface SnapshotRecord {
  streamer_id: string;
  total_stars: number;
  total_minutes: number;
}

/**
 * 등록된 스트리머 목록과 SoopScope 수집 데이터를 매핑하여 월간 집계 레코드를 생성합니다.
 */
export function matchAndAggregate(
  registeredStreamers: Streamer[],
  scrapedRows: SoopScopeStreamerRow[],
  yearMonth: string
): Array<Omit<MonthlyAggregate, 'id' | 'updated_at'>> {
  const rowMap = new Map(scrapedRows.map((r) => [r.soopId.toLowerCase(), r]));

  return registeredStreamers.map((streamer) => {
    const matched = rowMap.get(streamer.soop_id.toLowerCase());
    const totalStars = matched?.totalStars || 0;
    const totalMinutes = matched?.totalMinutes || 0;
    const broadcastHours = minutesToHours(totalMinutes);

    return {
      streamer_id: streamer.id,
      year_month: yearMonth,
      total_stars: totalStars,
      broadcast_hours: broadcastHours,
      prev_month_stars: 0,
      diff_stars: 0,
    };
  });
}

/**
 * 스마트 변경 감지 (Dirty Check):
 * 직전 수집 스냅샷과 비교하여 별풍선이나 방송시간이 실제로 증가/변경된 레코드만 필터링합니다.
 */
export function filterChangedSnapshots(
  previousMap: Map<string, { total_stars: number; total_minutes: number }>,
  currentRecords: SnapshotRecord[]
): SnapshotRecord[] {
  return currentRecords.filter((curr) => {
    const prev = previousMap.get(curr.streamer_id);
    if (!prev) return true; // 이전에 기록이 없으면 신규 저장

    // 별풍선 또는 방송시간이 변경되었을 때만 저장
    return prev.total_stars !== curr.total_stars || prev.total_minutes !== curr.total_minutes;
  });
}
