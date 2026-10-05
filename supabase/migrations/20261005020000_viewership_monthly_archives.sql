CREATE TABLE IF NOT EXISTS public.viewership_monthly_archives (
  year_month TEXT NOT NULL,
  soop_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  crew_name TEXT,
  average_viewers INTEGER NOT NULL DEFAULT 0,
  total_viewers INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  broadcast_minutes INTEGER NOT NULL DEFAULT 0,
  viewer_ship INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collection_status TEXT NOT NULL DEFAULT 'available',
  PRIMARY KEY (year_month, soop_id)
);

ALTER TABLE public.viewership_monthly_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viewership_monthly_archives FROM anon, authenticated;
GRANT SELECT ON public.viewership_monthly_archives TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.viewership_monthly_archives TO service_role;

DROP POLICY IF EXISTS "Public can read viewership monthly archives" ON public.viewership_monthly_archives;
CREATE POLICY "Public can read viewership monthly archives"
  ON public.viewership_monthly_archives FOR SELECT USING (true);
