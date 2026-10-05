export interface ViewershipStreamerSnapshot {
  soopId: string;
  nickname: string;
  profileImageUrl?: string | null;
  crewName?: string | null;
  totalStars?: number;
  starsSource?: string;
  averageViewers: number;
  totalViewers: number;
  peakViewers: number;
  broadcastMinutes: number;
  viewerShip: number;
  fetchedAt: string;
  collectionStatus?: 'available' | 'unavailable' | 'excluded';
  viewershipStatus?: string;
}

export const VIEWERSHIP_EXCLUDED_SOOP_IDS = new Set<string>();

export interface ViewershipMonthlySnapshot {
  yearMonth: string;
  updatedAt: string;
  requestedCount: number;
  fetchedCount: number;
  failedCount: number;
  streamers: ViewershipStreamerSnapshot[];
}

export interface ViewershipCrewSummary {
  crewName: string;
  members: ViewershipStreamerSnapshot[];
  activeMemberCount: number;
  averageViewers: number;
  totalViewerShip: number;
}

export function calculateViewerShip(averageViewers: number, broadcastMinutes: number): number {
  if (averageViewers <= 0 || broadcastMinutes <= 0) return 0;
  return Math.round((averageViewers * broadcastMinutes) / 60);
}

export function summarizeViewershipCrews(streamers: ViewershipStreamerSnapshot[]): ViewershipCrewSummary[] {
  const membersByCrew = new Map<string, ViewershipStreamerSnapshot[]>();
  for (const streamer of streamers) {
    if (!streamer.crewName) continue;
    const members = membersByCrew.get(streamer.crewName) ?? [];
    members.push(streamer);
    membersByCrew.set(streamer.crewName, members);
  }

  return Array.from(membersByCrew, ([crewName, members]) => {
    const activeMembers = members.filter((member) => member.broadcastMinutes > 0);
    const averageViewers = activeMembers.length > 0
      ? Math.round(activeMembers.reduce((sum, member) => sum + member.averageViewers, 0) / activeMembers.length)
      : 0;
    return {
      crewName,
      members: [...members].sort((a, b) => b.viewerShip - a.viewerShip || b.averageViewers - a.averageViewers),
      activeMemberCount: activeMembers.length,
      averageViewers,
      totalViewerShip: members.reduce((sum, member) => sum + member.viewerShip, 0),
    };
  }).sort((a, b) => b.averageViewers - a.averageViewers || b.totalViewerShip - a.totalViewerShip);
}
