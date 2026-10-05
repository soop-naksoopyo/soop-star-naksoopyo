CREATE TABLE IF NOT EXISTS public.soopscope_monthly_roster (
  year_month TEXT NOT NULL,
  soop_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  crew_name TEXT,
  PRIMARY KEY (year_month, soop_id)
);
ALTER TABLE public.soopscope_monthly_roster ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.soopscope_monthly_roster FROM anon, authenticated;
GRANT SELECT ON public.soopscope_monthly_roster TO service_role;

CREATE TABLE IF NOT EXISTS public.soopscope_monthly_snapshots (
  year_month TEXT NOT NULL,
  soop_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  crew_name TEXT,
  average_viewers INT NOT NULL DEFAULT 0,
  total_viewers INT NOT NULL DEFAULT 0,
  peak_viewers INT NOT NULL DEFAULT 0,
  broadcast_minutes INT NOT NULL DEFAULT 0,
  viewer_ship INT NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (year_month, soop_id)
);

ALTER TABLE public.soopscope_monthly_snapshots ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.soopscope_monthly_snapshots TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.soopscope_monthly_snapshots FROM anon, authenticated;
DROP POLICY IF EXISTS "Public can read SoopScope monthly snapshots" ON public.soopscope_monthly_snapshots;
CREATE POLICY "Public can read SoopScope monthly snapshots"
  ON public.soopscope_monthly_snapshots FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.soopscope_sync_runs (
  window_start TIMESTAMPTZ NOT NULL,
  shard_index SMALLINT NOT NULL CHECK (shard_index BETWEEN 0 AND 4),
  year_month TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_count INT NOT NULL DEFAULT 0,
  fetched_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  error_message TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (window_start, shard_index)
);

ALTER TABLE public.soopscope_sync_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.soopscope_sync_runs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.soopscope_monthly_snapshots, public.soopscope_sync_runs TO service_role;

INSERT INTO public.soopscope_monthly_roster (year_month, soop_id, nickname, profile_image_url, crew_name)
SELECT '2026-10', target.soop_id, target.nickname, target.profile_image_url, target.crew_name
FROM jsonb_to_recordset($targets$[
  {
    "soop_id": "suji84",
    "nickname": "두디",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/su/suji84/suji84.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "rlekfu6",
    "nickname": "박재혁",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rl/rlekfu6/rlekfu6.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "pokimasiso",
    "nickname": "또해영",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/po/pokimasiso/pokimasiso.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "dptmfl1258",
    "nickname": "예슬",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dp/dptmfl1258/dptmfl1258.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "jiinii000",
    "nickname": "밥새",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ji/jiinii000/jiinii000.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "palko1",
    "nickname": "신상문",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/pa/palko1/palko1.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "mwhdgus",
    "nickname": "윤진규",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/mw/mwhdgus/mwhdgus.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "aram1213",
    "nickname": "아라미",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ar/aram1213/aram1213.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "jungym0116",
    "nickname": "아링",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ju/jungym0116/jungym0116.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "kysvic2",
    "nickname": "유체리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ky/kysvic2/kysvic2.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "jihoon002",
    "nickname": "박수범",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ji/jihoon002/jihoon002.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "roa0216",
    "nickname": "허로아",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ro/roa0216/roa0216.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "kjhanna824",
    "nickname": "미진이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/kj/kjhanna824/kjhanna824.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "heksd",
    "nickname": "파메",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/he/heksd/heksd.jpg",
    "crew_name": "더블비"
  },
  {
    "soop_id": "yuzzzz",
    "nickname": "유즈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/yu/yuzzzz/yuzzzz.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "diniowo",
    "nickname": "막내현진",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/di/diniowo/diniowo.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "123rhaxld",
    "nickname": "최도랑",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/12/123rhaxld/123rhaxld.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "2ahgo1203",
    "nickname": "이아깽",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/2a/2ahgo1203/2ahgo1203.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "tndkekdy",
    "nickname": "하윤",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/tn/tndkekdy/tndkekdy.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "killkg2",
    "nickname": "김건욱",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ki/killkg2/killkg2.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "queenzu",
    "nickname": "퀸주",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/qu/queenzu/queenzu.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "corgi1102",
    "nickname": "냥냥코기",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/co/corgi1102/corgi1102.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "ksmo54",
    "nickname": "구라미스",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ks/ksmo54/ksmo54.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "parkle1006",
    "nickname": "박듀듀",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/pa/parkle1006/parkle1006.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "wodnrdldia",
    "nickname": "도재욱",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wo/wodnrdldia/wodnrdldia.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "dbwjdcool1",
    "nickname": "키링",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/db/dbwjdcool1/dbwjdcool1.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "jun10280",
    "nickname": "박성준",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ju/jun10280/jun10280.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "1004yomi",
    "nickname": "단솔",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/10/1004yomi/1004yomi.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "qwer1317",
    "nickname": "으니",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/qw/qwer1317/qwer1317.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "aybjc2319",
    "nickname": "진유성",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ay/aybjc2319/aybjc2319.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "peros777",
    "nickname": "박성균",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/pe/peros777/peros777.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "totoo23",
    "nickname": "밍또얌",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/to/totoo23/totoo23.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "zzzz809",
    "nickname": "백갑숙",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/zz/zzzz809/zzzz809.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "dbrbals",
    "nickname": "초난강",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/db/dbrbals/dbrbals.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "ywww123",
    "nickname": "트슈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/yw/ywww123/ywww123.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "dmk1212",
    "nickname": "액션구드론",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dm/dmk1212/dmk1212.jpg",
    "crew_name": "뉴캣슬"
  },
  {
    "soop_id": "freshtomato",
    "nickname": "토마토",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/fr/freshtomato/freshtomato.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "seemin88",
    "nickname": "비타밍",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/se/seemin88/seemin88.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "wjswlgns09",
    "nickname": "지두두",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wj/wjswlgns09/wjswlgns09.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "sksmsskdsl10",
    "nickname": "낭니",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sk/sksmsskdsl10/sksmsskdsl10.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "fpahsdltu1",
    "nickname": "주하랑",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/fp/fpahsdltu1/fpahsdltu1.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "rnaqpdrjf",
    "nickname": "남덕선",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rn/rnaqpdrjf/rnaqpdrjf.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "dlaguswl501",
    "nickname": "임조이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dl/dlaguswl501/dlaguswl501.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "vldpfm2",
    "nickname": "아리송이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/vl/vldpfm2/vldpfm2.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "2meonjin",
    "nickname": "먼진",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/2m/2meonjin/2meonjin.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "thelddl",
    "nickname": "햇살",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/th/thelddl/thelddl.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "h78ert",
    "nickname": "박준오",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/h7/h78ert/h78ert.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "hoonykkk",
    "nickname": "사테",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ho/hoonykkk/hoonykkk.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "soju2022",
    "nickname": "소주양",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/so/soju2022/soju2022.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "jmc06170",
    "nickname": "왜냐맨",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/jm/jmc06170/jmc06170.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "minchul",
    "nickname": "김민철",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/mi/minchul/minchul.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "goodzerg",
    "nickname": "배성흠",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/go/goodzerg/goodzerg.jpg",
    "crew_name": "캄몬"
  },
  {
    "soop_id": "seul0316",
    "nickname": "슬돌이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/se/seul0316/seul0316.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "jooyoung0040",
    "nickname": "또아",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/jo/jooyoung0040/jooyoung0040.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "goni2677",
    "nickname": "내가먼지",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/go/goni2677/goni2677.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "skygkrtn",
    "nickname": "김학수",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sk/skygkrtn/skygkrtn.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "qkrgkdms01",
    "nickname": "박하악",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/qk/qkrgkdms01/qkrgkdms01.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "clclcl8888",
    "nickname": "늑대채린",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/cl/clclcl8888/clclcl8888.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "zcv0320",
    "nickname": "보혜",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/zc/zcv0320/zcv0320.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "agah1106",
    "nickname": "링고",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ag/agah1106/agah1106.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "kjy3443",
    "nickname": "연또",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/kj/kjy3443/kjy3443.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "ever316",
    "nickname": "정소윤",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ev/ever316/ever316.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "seols2",
    "nickname": "정서린",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/se/seols2/seols2.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "tmsh401",
    "nickname": "장윤철",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/tm/tmsh401/tmsh401.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "neverdieyj",
    "nickname": "정영재",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ne/neverdieyj/neverdieyj.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "hongduck9737",
    "nickname": "홍덕",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ho/hongduck9737/hongduck9737.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "kkmkhh1234",
    "nickname": "깨모다",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/kk/kkmkhh1234/kkmkhh1234.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "minyoo3972",
    "nickname": "유민",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/mi/minyoo3972/minyoo3972.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "wjdalsrl95",
    "nickname": "정민기",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wj/wjdalsrl95/wjdalsrl95.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "understay",
    "nickname": "고석현",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/un/understay/understay.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "wittyku",
    "nickname": "냥수디",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wi/wittyku/wittyku.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "thdeksql",
    "nickname": "단비송",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/th/thdeksql/thdeksql.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "meezmeun",
    "nickname": "미지믄",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/me/meezmeun/meezmeun.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "gpfl5473",
    "nickname": "히리캉",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gp/gpfl5473/gpfl5473.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "skdidkfl",
    "nickname": "♥김아린",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sk/skdidkfl/skdidkfl.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "jelly97",
    "nickname": "찌효",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/je/jelly97/jelly97.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "whitedaysen",
    "nickname": "세니-.-",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wh/whitedaysen/whitedaysen.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "nvbn114",
    "nickname": "♥앙혜원",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/nv/nvbn114/nvbn114.jpg",
    "crew_name": "케이대"
  },
  {
    "soop_id": "gddms97",
    "nickname": "하블리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gd/gddms97/gddms97.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "littlekim12",
    "nickname": "김바다",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/li/littlekim12/littlekim12.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "wlgua7272",
    "nickname": "2라니",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wl/wlgua7272/wlgua7272.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "wjddmstj79",
    "nickname": "쟈닌",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wj/wjddmstj79/wjddmstj79.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "tamama88",
    "nickname": "타마양",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ta/tamama88/tamama88.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "phh95426",
    "nickname": "소심",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ph/phh95426/phh95426.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "fudnjs0235",
    "nickname": "려원",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/fu/fudnjs0235/fudnjs0235.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "dpfgc3",
    "nickname": "홍구",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dp/dpfgc3/dpfgc3.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "owoouoowo",
    "nickname": "모비",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ow/owoouoowo/owoouoowo.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "tjdeosks",
    "nickname": "김성대",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/tj/tjdeosks/tjdeosks.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "rldyal71",
    "nickname": "휘연",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rl/rldyal71/rldyal71.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "min030606",
    "nickname": "면추가",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/mi/min030606/min030606.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "dgh9641",
    "nickname": "김병수",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dg/dgh9641/dgh9641.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "ftrudals",
    "nickname": "나린",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ft/ftrudals/ftrudals.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "sharpragu",
    "nickname": "조기석",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sh/sharpragu/sharpragu.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "rladuddo99",
    "nickname": "구성훈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rl/rladuddo99/rladuddo99.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "shyshy123",
    "nickname": "김영진",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sh/shyshy123/shyshy123.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "dkfka8945",
    "nickname": "라미",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dk/dkfka8945/dkfka8945.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "vhrtmspt",
    "nickname": "김민우",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/vh/vhrtmspt/vhrtmspt.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "dyaan0v0",
    "nickname": "정다닝",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dy/dyaan0v0/dyaan0v0.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "begoniah",
    "nickname": "백원이야",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/be/begoniah/begoniah.jpg",
    "crew_name": "JSA"
  },
  {
    "soop_id": "tato1104",
    "nickname": "밍가",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ta/tato1104/tato1104.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "rlsk0705",
    "nickname": "기나",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rl/rlsk0705/rlsk0705.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "cyj982002",
    "nickname": "다나짱",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/cy/cyj982002/cyj982002.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "dmswls4565",
    "nickname": "공다츠",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dm/dmswls4565/dmswls4565.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "rondobba",
    "nickname": "지동원",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ro/rondobba/rondobba.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "chuwari13",
    "nickname": "요구리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ch/chuwari13/chuwari13.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "fidfidfid",
    "nickname": "박쭈이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/fi/fidfidfid/fidfidfid.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "qndnd12",
    "nickname": "김기덕",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/qn/qndnd12/qndnd12.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "pazzy1",
    "nickname": "파찌",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/pa/pazzy1/pazzy1.jpg",
    "crew_name": "광준"
  },
  {
    "soop_id": "tjgpdus97",
    "nickname": "요닝",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/tj/tjgpdus97/tjgpdus97.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "alaelddl97",
    "nickname": "민지",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/al/alaelddl97/alaelddl97.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "nreupne",
    "nickname": "핑핑",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/nr/nreupne/nreupne.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "wlswn6565",
    "nickname": "진땅콩",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wl/wlswn6565/wlswn6565.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "imducko3o",
    "nickname": "오리꿍",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/im/imducko3o/imducko3o.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "ys9024",
    "nickname": "주서리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ys/ys9024/ys9024.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "queen030",
    "nickname": "효짱",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/qu/queen030/queen030.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "viwi05",
    "nickname": "럭키위키",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/vi/viwi05/viwi05.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "j4141h",
    "nickname": "요괴버스",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/j4/j4141h/j4141h.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "kuyol",
    "nickname": "강구열",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ku/kuyol/kuyol.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "djdbstn",
    "nickname": "어윤수",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dj/djdbstn/djdbstn.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "dbsdydx",
    "nickname": "윤용태",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/db/dbsdydx/dbsdydx.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "hby0724",
    "nickname": "황병영",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/hb/hby0724/hby0724.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "kss33325",
    "nickname": "김수식",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ks/kss33325/kss33325.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "wjswpalssla1",
    "nickname": "전제민",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wj/wjswpalssla1/wjswpalssla1.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "moguleave",
    "nickname": "모리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/mo/moguleave/moguleave.jpg",
    "crew_name": "드림즈"
  },
  {
    "soop_id": "kimp1ay",
    "nickname": "구키",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ki/kimp1ay/kimp1ay.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "hee4343",
    "nickname": "비재희",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/he/hee4343/hee4343.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "daegalheo",
    "nickname": "허유",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/da/daegalheo/daegalheo.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "byebye22",
    "nickname": "에공",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/by/byebye22/byebye22.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "snowssa",
    "nickname": "설둥이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sn/snowssa/snowssa.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "nylove276",
    "nickname": "삐약비약",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ny/nylove276/nylove276.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "gkgus99",
    "nickname": "하이현",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gk/gkgus99/gkgus99.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "dlwjddls30",
    "nickname": "야생땃쥐",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dl/dlwjddls30/dlwjddls30.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "asdsa1113",
    "nickname": "세월",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/as/asdsa1113/asdsa1113.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "jhyhlli123",
    "nickname": "박준혁",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/jh/jhyhlli123/jhyhlli123.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "wnsgur2da",
    "nickname": "압삽e",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wn/wnsgur2da/wnsgur2da.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "youaregood",
    "nickname": "진니",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/yo/youaregood/youaregood.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "e2003jin",
    "nickname": "여지니",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/e2/e2003jin/e2003jin.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "shj06170",
    "nickname": "얌쭈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sh/shj06170/shj06170.jpg",
    "crew_name": "와플대"
  },
  {
    "soop_id": "ldk8481",
    "nickname": "슈슈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ld/ldk8481/ldk8481.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "dudwn4974",
    "nickname": "안아",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/du/dudwn4974/dudwn4974.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "kitty1029",
    "nickname": "꼬니부깅",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ki/kitty1029/kitty1029.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "dmsgkdn12",
    "nickname": "엔돌핀",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dm/dmsgkdn12/dmsgkdn12.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "janjanoo",
    "nickname": "진서랄까",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ja/janjanoo/janjanoo.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "totlllsz",
    "nickname": "몽순",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/to/totlllsz/totlllsz.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "happyhee97",
    "nickname": "예담",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ha/happyhee97/happyhee97.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "hy4985",
    "nickname": "뽀누나",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/hy/hy4985/hy4985.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "bumsoo552",
    "nickname": "김범수",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/bu/bumsoo552/bumsoo552.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "eeceec",
    "nickname": "뚜미",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ee/eeceec/eeceec.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "wkddudrms15",
    "nickname": "난수",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/wk/wkddudrms15/wkddudrms15.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "dmsthfdldia",
    "nickname": "라운이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dm/dmsthfdldia/dmsthfdldia.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "xzqwe1",
    "nickname": "황단비",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/xz/xzqwe1/xzqwe1.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "lky6407",
    "nickname": "프발",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/lk/lky6407/lky6407.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "jh3697",
    "nickname": "서문지훈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/jh/jh3697/jh3697.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "nada11200",
    "nickname": "이윤열",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/na/nada11200/nada11200.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "ghlidhjgioew",
    "nickname": "다라츄",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gh/ghlidhjgioew/ghlidhjgioew.jpg",
    "crew_name": "BGM"
  },
  {
    "soop_id": "have1y",
    "nickname": "김채이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ha/have1y/have1y.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "rabbitmiffy",
    "nickname": "최세상",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ra/rabbitmiffy/rabbitmiffy.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "arr0530",
    "nickname": "권아온",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ar/arr0530/arr0530.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "pengmuin",
    "nickname": "민댕댕",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/pe/pengmuin/pengmuin.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "hamhee",
    "nickname": "햄희",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ha/hamhee/hamhee.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "heyyo0123",
    "nickname": "헤요이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/he/heyyo0123/heyyo0123.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "ehcl000",
    "nickname": "또치",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/eh/ehcl000/ehcl000.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "hasaeyo",
    "nickname": "안눙이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ha/hasaeyo/hasaeyo.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "lyh8808",
    "nickname": "이영한",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ly/lyh8808/lyh8808.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "synyoung",
    "nickname": "시녕뭉",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sy/synyoung/synyoung.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "jackpot",
    "nickname": "이창우",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ja/jackpot/jackpot.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "paralyze92",
    "nickname": "정경두",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/pa/paralyze92/paralyze92.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "askl021",
    "nickname": "빡죠스",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/as/askl021/askl021.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "rlarnfk24",
    "nickname": "만두호성",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rl/rlarnfk24/rlarnfk24.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "ghkdud1617",
    "nickname": "카히리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gh/ghkdud1617/ghkdud1617.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "bora99",
    "nickname": "구보라",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/bo/bora99/bora99.jpg",
    "crew_name": "마범대"
  },
  {
    "soop_id": "ovoa3316",
    "nickname": "나예리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ov/ovoa3316/ovoa3316.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "lingolinga",
    "nickname": "링가",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/li/lingolinga/lingolinga.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "gangeda",
    "nickname": "갱이다",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ga/gangeda/gangeda.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "faker1004",
    "nickname": "가영",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/fa/faker1004/faker1004.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "ehgmldud1233",
    "nickname": "히엉",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/eh/ehgmldud1233/ehgmldud1233.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "jhpark7712",
    "nickname": "빡재",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/jh/jhpark7712/jhpark7712.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "tjwjddms1565",
    "nickname": "선정은",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/tj/tjwjddms1565/tjwjddms1565.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "dollooo",
    "nickname": "제갈츄빈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/do/dollooo/dollooo.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "x1aohongmao",
    "nickname": "오세은",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/x1/x1aohongmao/x1aohongmao.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "skarbwhgc",
    "nickname": "팔레트",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sk/skarbwhgc/skarbwhgc.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "rudzhd123",
    "nickname": "경콩",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ru/rudzhd123/rudzhd123.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "yuna1024",
    "nickname": "김유나",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/yu/yuna1024/yuna1024.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "bhy95",
    "nickname": "배호딱",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/bh/bhy95/bhy95.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "scan1014",
    "nickname": "유승곤",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sc/scan1014/scan1014.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "ndudska620",
    "nickname": "달그락영주",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/nd/ndudska620/ndudska620.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "kwh1992",
    "nickname": "우힝이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/kw/kwh1992/kwh1992.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "chchchshai",
    "nickname": "유이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ch/chchchshai/chchchshai.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "maeong2",
    "nickname": "메옹",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ma/maeong2/maeong2.jpg",
    "crew_name": "흑카데미"
  },
  {
    "soop_id": "lovelove7777",
    "nickname": "서지수",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/lo/lovelove7777/lovelove7777.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "5eulgii",
    "nickname": "김말랑",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/5e/5eulgii/5eulgii.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "gnsl418",
    "nickname": "이예훈",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gn/gnsl418/gnsl418.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "jscando77",
    "nickname": "빵리나",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/js/jscando77/jscando77.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "nasd06",
    "nickname": "수니양",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/na/nasd06/nasd06.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "gkdud3294",
    "nickname": "오하얀",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/gk/gkdud3294/gkdud3294.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "eunseo0152",
    "nickname": "은서",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/eu/eunseo0152/eunseo0152.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "lily0104",
    "nickname": "정소이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/li/lily0104/lily0104.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "zealot0846",
    "nickname": "원선재",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ze/zealot0846/zealot0846.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "danu619",
    "nickname": "다뉴",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/da/danu619/danu619.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "eunjo0105",
    "nickname": "은조",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/eu/eunjo0105/eunjo0105.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "qhkrwns12",
    "nickname": "미동미동",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/qh/qhkrwns12/qhkrwns12.jpg",
    "crew_name": "DM"
  },
  {
    "soop_id": "jiwooris2",
    "nickname": "지우리",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ji/jiwooris2/jiwooris2.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "dohyeon97",
    "nickname": "선우도현",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/do/dohyeon97/dohyeon97.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "khl1589",
    "nickname": "요시",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/kh/khl1589/khl1589.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "finepearls",
    "nickname": "혜냥",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/fi/finepearls/finepearls.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "rnjsgurwls15",
    "nickname": "권혁진",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rn/rnjsgurwls15/rnjsgurwls15.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "cksgmldbs",
    "nickname": "몽군",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ck/cksgmldbs/cksgmldbs.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "haeun5513",
    "nickname": "밤하밍",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ha/haeun5513/haeun5513.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "djathekd",
    "nickname": "연예인",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dj/djathekd/djathekd.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "snfjdro369",
    "nickname": "윤수철",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/sn/snfjdro369/snfjdro369.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "simcheong23",
    "nickname": "또봉순",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/si/simcheong23/simcheong23.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "della2440",
    "nickname": "예실",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/de/della2440/della2440.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "a6r8zfymkc6",
    "nickname": "카나에_",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/a6/a6r8zfymkc6/a6r8zfymkc6.jpg",
    "crew_name": "신세계"
  },
  {
    "soop_id": "jjjjeong",
    "nickname": "태린",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/jj/jjjjeong/jjjjeong.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "chanmeyo",
    "nickname": "김세주",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ch/chanmeyo/chanmeyo.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "rlawhdwns6",
    "nickname": "멍이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rl/rlawhdwns6/rlawhdwns6.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "rnfma14",
    "nickname": "김설",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/rn/rnfma14/rnfma14.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "byromantic",
    "nickname": "최재성",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/by/byromantic/byromantic.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "janghoman",
    "nickname": "베트남테란",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/ja/janghoman/janghoman.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "bwstar",
    "nickname": "배병우",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/bw/bwstar/bwstar.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "dkswjddn92",
    "nickname": "안정우",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/dk/dkswjddn92/dkswjddn92.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "tjdwnls123",
    "nickname": "박성진",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/tj/tjdwnls123/tjdwnls123.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "zinsim",
    "nickname": "봄덕이",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/zi/zinsim/zinsim.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "yyssaa33",
    "nickname": "제티♥",
    "profile_image_url": "https://profile.img.sooplive.co.kr/LOGO/yy/yyssaa33/yyssaa33.jpg",
    "crew_name": "소병대"
  },
  {
    "soop_id": "xodud1898",
    "nickname": "태영♥",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "yochba0402",
    "nickname": "졈니",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "yjk011599",
    "nickname": "나무늘봉순",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "zalalz",
    "nickname": "조은",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "qpqpro",
    "nickname": "디임",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "forweourus",
    "nickname": "이유란ㅇ",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "ouo20411",
    "nickname": "히댕",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "sdkels",
    "nickname": "강덕구",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "kmj05317",
    "nickname": "우리밍_",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "rhakdncjs90",
    "nickname": "으냉이",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "gks2wl",
    "nickname": "앵지",
    "profile_image_url": null,
    "crew_name": null
  },
  {
    "soop_id": "parkbano",
    "nickname": "시라소니aa",
    "profile_image_url": null,
    "crew_name": null
  }
]$targets$::jsonb) AS target(
  soop_id TEXT,
  nickname TEXT,
  profile_image_url TEXT,
  crew_name TEXT
)
ON CONFLICT (year_month, soop_id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  profile_image_url = EXCLUDED.profile_image_url,
  crew_name = EXCLUDED.crew_name;
