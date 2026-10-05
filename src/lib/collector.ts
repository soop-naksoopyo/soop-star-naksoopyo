export interface SoopScopeStreamerRow {
  rank: number;
  soopId: string;
  nickname: string;
  category: string;
  profileImg: string;
  totalStars: number;
  totalMinutes: number;
}

export interface SoopScopeResponse {
  rows: SoopScopeStreamerRow[];
}

/**
 * SoopScope 기간별 랭킹 API를 호출하여 스트리머 별풍선/방송시간 데이터를 조회합니다.
 */
export async function fetchSoopScopeStreamers(
  startDate: string,
  endDate: string,
  limit: number = 500
): Promise<SoopScopeStreamerRow[]> {
  const url = `https://soopscope.com/api/v2/rank/streamer-period?start=${startDate}&end=${endDate}&limit=${limit}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Referer: 'https://soopscope.com/rank',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SoopScope API responded with status ${response.status}`);
  }

  const data: SoopScopeResponse = await response.json();
  return (data.rows || []).map(({ rank, soopId, nickname, category, profileImg, totalStars, totalMinutes }) => ({
    rank, soopId, nickname, category, profileImg, totalStars, totalMinutes,
  }));
}
