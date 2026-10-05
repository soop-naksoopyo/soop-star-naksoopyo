export interface FailedStreamerInfo {
  soopId: string;
  nickname: string;
  crewName?: string;
  reason?: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  kstTime: string;
  yearMonth: string;
  trigger: 'schedule' | 'manual';
  status: 'success' | 'partial' | 'failed';
  requestedCount: number;
  fetchedCount: number;
  failedCount: number;
  failedStreamers: FailedStreamerInfo[];
  durationSeconds?: number;
  note?: string;
}

export const SYNC_LOG_HISTORY: SyncLogEntry[] = [
  {
    "id": "run-1791186565487",
    "timestamp": "2026-10-05T07:49:25.487Z",
    "kstTime": "2026-10-05 16:49:25",
    "yearMonth": "2026-10",
    "trigger": "schedule",
    "status": "success",
    "requestedCount": 237,
    "fetchedCount": 237,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 90,
    "note": "2026-10 스냅샷 수집 (237/237명)"
  },
  {
    "id": "run-37274865750",
    "timestamp": "2026-10-05T06:57:17Z",
    "kstTime": "2026-10-05 15:57:17",
    "yearMonth": "2026-10",
    "trigger": "schedule",
    "status": "success",
    "requestedCount": 237,
    "fetchedCount": 237,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 95,
    "note": "정기 자동 스케줄 (평소 30분 주기 수집) — 100% 정상 완료"
  },
  {
    "id": "run-37272243300",
    "timestamp": "2026-10-05T06:25:58Z",
    "kstTime": "2026-10-05 15:25:58",
    "yearMonth": "2026-10",
    "trigger": "schedule",
    "status": "success",
    "requestedCount": 237,
    "fetchedCount": 237,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 98,
    "note": "정기 자동 스케줄 수집 — 100% 정상 완료"
  },
  {
    "id": "run-37272091367",
    "timestamp": "2026-10-05T06:24:23Z",
    "kstTime": "2026-10-05 15:24:23",
    "yearMonth": "2026-09",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 212,
    "fetchedCount": 212,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 111,
    "note": "9월 아카이브 숲스코프 공식 확정 수치 재수집 (박재혁, 김학수 포함) — 100% 정상 완료"
  },
  {
    "id": "run-37270864616",
    "timestamp": "2026-10-05T06:15:18Z",
    "kstTime": "2026-10-05 15:15:18",
    "yearMonth": "2026-10",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 237,
    "fetchedCount": 237,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 88,
    "note": "10월 뷰어십 전체 인원 복구 수집 — 100% 정상 완료"
  },
  {
    "id": "run-37268042837",
    "timestamp": "2026-10-05T05:31:37Z",
    "kstTime": "2026-10-05 14:31:37",
    "yearMonth": "2026-10",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 235,
    "fetchedCount": 235,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 94,
    "note": "10월 실시간 정기 갱신 — 100% 정상 완료"
  },
  {
    "id": "run-37267408541",
    "timestamp": "2026-10-05T05:23:12Z",
    "kstTime": "2026-10-05 14:23:12",
    "yearMonth": "2026-10",
    "trigger": "schedule",
    "status": "success",
    "requestedCount": 235,
    "fetchedCount": 235,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 91,
    "note": "정기 스케줄 수집 — 100% 정상 완료"
  },
  {
    "id": "run-37267117080",
    "timestamp": "2026-10-05T05:19:19Z",
    "kstTime": "2026-10-05 14:19:19",
    "yearMonth": "2026-10",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 235,
    "fetchedCount": 235,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 87,
    "note": "10월 정기 스냅샷 갱신 — 100% 정상 완료"
  },
  {
    "id": "run-37266255739",
    "timestamp": "2026-10-05T05:07:54Z",
    "kstTime": "2026-10-05 14:07:54",
    "yearMonth": "2026-09",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 210,
    "fetchedCount": 210,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 124,
    "note": "9월 뷰어십 최초 스냅샷 생성 — 100% 정상 완료"
  },
  {
    "id": "run-37265130102",
    "timestamp": "2026-10-05T04:50:35Z",
    "kstTime": "2026-10-05 13:50:35",
    "yearMonth": "2026-10",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 235,
    "fetchedCount": 235,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 98,
    "note": "10월 샤드 병합 테스트 및 갱신 — 100% 정상 완료"
  },
  {
    "id": "run-37262355538",
    "timestamp": "2026-10-05T04:12:45Z",
    "kstTime": "2026-10-05 13:12:45",
    "yearMonth": "2026-10",
    "trigger": "manual",
    "status": "success",
    "requestedCount": 235,
    "fetchedCount": 235,
    "failedCount": 0,
    "failedStreamers": [],
    "durationSeconds": 104,
    "note": "10월 샤드 수집기 구축 완료 검증 — 100% 정상 완료"
  }
];
