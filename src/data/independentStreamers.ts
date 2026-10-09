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
      "totalStars": 149479,
      "broadcastHours": 68.5
    },
    {
      "soopId": "yochba0402",
      "nickname": "졈니",
      "totalStars": 196863,
      "broadcastHours": 43.6
    },
    {
      "soopId": "yjk011599",
      "nickname": "나무늘봉순",
      "totalStars": 185979,
      "broadcastHours": 91.9
    },
    {
      "soopId": "zalalz",
      "nickname": "조은",
      "totalStars": 49588,
      "broadcastHours": 22.6
    },
    {
      "soopId": "qpqpro",
      "nickname": "디임",
      "totalStars": 126701,
      "broadcastHours": 70.6
    },
    {
      "soopId": "ouo20411",
      "nickname": "히댕",
      "totalStars": 74758,
      "broadcastHours": 12.2
    },
    {
      "soopId": "sdkels",
      "nickname": "강덕구",
      "totalStars": 35967,
      "broadcastHours": 43.2
    },
    {
      "soopId": "kmj05317",
      "nickname": "우리밍_",
      "totalStars": 77847,
      "broadcastHours": 68.4
    },
    {
      "soopId": "rhakdncjs90",
      "nickname": "으냉이",
      "totalStars": 150743,
      "broadcastHours": 117.9
    },
    {
      "soopId": "gks2wl",
      "nickname": "앵지",
      "totalStars": 57591,
      "broadcastHours": 48.1
    },
    {
      "soopId": "dmsgkdn12",
      "nickname": "엔돌핀♥",
      "totalStars": 24656,
      "broadcastHours": 38.6
    },
    {
      "soopId": "forweourus",
      "nickname": "이유란ㅇ",
      "totalStars": 82024,
      "broadcastHours": 34.3
    },
    {
      "soopId": "qwer1317",
      "nickname": "ε으니з",
      "totalStars": 8283,
      "broadcastHours": 36.9
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
    },
    {
      "soopId": "qwer1317",
      "nickname": "으니",
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
