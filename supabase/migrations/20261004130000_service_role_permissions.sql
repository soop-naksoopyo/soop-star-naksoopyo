-- Allow the protected sync function to read its roster and upsert Poonggo snapshots.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.crews, public.streamers TO service_role;
GRANT SELECT, INSERT, UPDATE
  ON public.poonggo_monthly_snapshots, public.poonggo_sync_runs
  TO service_role;
