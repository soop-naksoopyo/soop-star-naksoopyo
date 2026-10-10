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
      "totalStars": 159103,
      "broadcastHours": 72.7
    },
    {
      "soopId": "yochba0402",
      "nickname": "졈니",
      "totalStars": 200954,
      "broadcastHours": 48.2
    },
    {
      "soopId": "yjk011599",
      "nickname": "나무늘봉순",
      "totalStars": 215527,
      "broadcastHours": 100.4
    },
    {
      "soopId": "zalalz",
      "nickname": "조은",
      "totalStars": 60142,
      "broadcastHours": 26.7
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
      "totalStars": 44400,
      "broadcastHours": 50
    },
    {
      "soopId": "kmj05317",
      "nickname": "우리밍_",
      "totalStars": 79712,
      "broadcastHours": 71.7
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
      "totalStars": 57592,
      "broadcastHours": 49.5
    },
    {
      "soopId": "dmsgkdn12",
      "nickname": "엔돌핀♥",
      "totalStars": 26648,
      "broadcastHours": 45.4
    },
    {
      "soopId": "forweourus",
      "nickname": "이유란ㅇ",
      "totalStars": 91645,
      "broadcastHours": 37.6
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
