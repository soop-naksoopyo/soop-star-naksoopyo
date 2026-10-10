import { StreamerRowData } from '@/components/StreamerRow';

export const INDEPENDENT_STREAMERS_BY_MONTH: Record<string, StreamerRowData[]> = {
  "2026-09": [
    {
      "soopId": "xodud1898",
      "nickname": "태영♥",
      "totalStars": 629979,
      "broadcastHours": 184
    },
    {
      "soopId": "yochba0402",
      "nickname": "졈니",
      "totalStars": 616088,
      "broadcastHours": 187
    },
    {
      "soopId": "yjk011599",
      "nickname": "나무늘봉순",
      "totalStars": 375102,
      "broadcastHours": 159
    },
    {
      "soopId": "zalalz",
      "nickname": "조은",
      "totalStars": 305209,
      "broadcastHours": 129
    },
    {
      "soopId": "qpqpro",
      "nickname": "디임",
      "totalStars": 388673,
      "broadcastHours": 217
    },
    {
      "soopId": "ouo20411",
      "nickname": "히댕",
      "totalStars": 233160,
      "broadcastHours": 120
    },
    {
      "soopId": "sdkels",
      "nickname": "강덕구",
      "totalStars": 269601,
      "broadcastHours": 174
    },
    {
      "soopId": "kmj05317",
      "nickname": "우리밍_",
      "totalStars": 165824,
      "broadcastHours": 196
    },
    {
      "soopId": "rhakdncjs90",
      "nickname": "으냉이",
      "totalStars": 221491,
      "broadcastHours": 141
    },
    {
      "soopId": "gks2wl",
      "nickname": "앵지",
      "totalStars": 157030,
      "broadcastHours": 152
    }
  ],
  "2026-10": [],
  "2026-11": []
};

export function getIndependentStreamers(yearMonth: string): StreamerRowData[] {
  if (INDEPENDENT_STREAMERS_BY_MONTH[yearMonth]) {
    return INDEPENDENT_STREAMERS_BY_MONTH[yearMonth];
  }
  const keys = Object.keys(INDEPENDENT_STREAMERS_BY_MONTH).sort();
  const fallbackKey = keys[keys.length - 1];
  return (INDEPENDENT_STREAMERS_BY_MONTH[fallbackKey] || []).map((s) => ({
    ...s,
    totalStars: 0,
    broadcastHours: 0,
  }));
}
