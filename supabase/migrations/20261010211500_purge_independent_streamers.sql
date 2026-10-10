-- Purge 13 independent streamers from collection tables and monthly snapshots for 2026-10 and onward
DELETE FROM public.soopscope_monthly_snapshots
WHERE year_month >= '2026-10'
  AND soop_id IN (
    'xodud1898',
    'yochba0402',
    'yjk011599',
    'zalalz',
    'qpqpro',
    'ouo20411',
    'sdkels',
    'kmj05317',
    'rhakdncjs90',
    'gks2wl',
    'dmsgkdn12',
    'forweourus',
    'qwer1317'
  );

DELETE FROM public.soopscope_monthly_roster
WHERE year_month >= '2026-10'
  AND soop_id IN (
    'xodud1898',
    'yochba0402',
    'yjk011599',
    'zalalz',
    'qpqpro',
    'ouo20411',
    'sdkels',
    'kmj05317',
    'rhakdncjs90',
    'gks2wl',
    'dmsgkdn12',
    'forweourus',
    'qwer1317'
  );

-- Remove from streamers if not affiliated with any crew
DELETE FROM public.streamers
WHERE crew_id IS NULL
  AND soop_id IN (
    'xodud1898',
    'yochba0402',
    'yjk011599',
    'zalalz',
    'qpqpro',
    'ouo20411',
    'sdkels',
    'kmj05317',
    'rhakdncjs90',
    'gks2wl',
    'dmsgkdn12',
    'forweourus',
    'qwer1317'
  );
