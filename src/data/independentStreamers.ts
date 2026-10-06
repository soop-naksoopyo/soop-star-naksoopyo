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
  "2026-10": [
    {
      "soopId": "xodud1898",
      "nickname": "태영♥",
      "totalStars": 91902,
      "broadcastHours": 39.7
    },
    {
      "soopId": "yochba0402",
      "nickname": "졈니",
      "totalStars": 78616,
      "broadcastHours": 23
    },
    {
      "soopId": "yjk011599",
      "nickname": "나무늘봉순",
      "totalStars": 117990,
      "broadcastHours": 52.9
    },
    {
      "soopId": "zalalz",
      "nickname": "조은",
      "totalStars": 49588,
      "broadcastHours": 15.9
    },
    {
      "soopId": "qpqpro",
      "nickname": "디임",
      "totalStars": 95953,
      "broadcastHours": 65
    },
    {
      "soopId": "ouo20411",
      "nickname": "히댕",
      "totalStars": 74758,
      "broadcastHours": 8.6
    },
    {
      "soopId": "sdkels",
      "nickname": "강덕구",
      "totalStars": 11050,
      "broadcastHours": 12.1
    },
    {
      "soopId": "kmj05317",
      "nickname": "우리밍_",
      "totalStars": 48706,
      "broadcastHours": 42.8
    },
    {
      "soopId": "rhakdncjs90",
      "nickname": "으냉이",
      "totalStars": 61210,
      "broadcastHours": 34.6
    },
    {
      "soopId": "gks2wl",
      "nickname": "앵지",
      "totalStars": 38878,
      "broadcastHours": 30.5
    },
    {
      "soopId": "dmsgkdn12",
      "nickname": "엔돌핀♥",
      "totalStars": 19428,
      "broadcastHours": 26.4
    }
  ],
  "2026-11": [
    {
      "soopId": "xodud1898",
      "nickname": "태영♥",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "yochba0402",
      "nickname": "졈니",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "yjk011599",
      "nickname": "나무늘봉순",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "zalalz",
      "nickname": "조은",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "qpqpro",
      "nickname": "디임",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "ouo20411",
      "nickname": "히댕",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "sdkels",
      "nickname": "강덕구",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "kmj05317",
      "nickname": "우리밍_",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "rhakdncjs90",
      "nickname": "으냉이",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "gks2wl",
      "nickname": "앵지",
      "totalStars": 0,
      "broadcastHours": 0
    },
    {
      "soopId": "dmsgkdn12",
      "nickname": "엔돌핀♥",
      "totalStars": 0,
      "broadcastHours": 0
    }
  ]
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
