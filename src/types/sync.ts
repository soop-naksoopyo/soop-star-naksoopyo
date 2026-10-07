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
