CREATE TABLE public.soopscope_sync_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX soopscope_sync_logs_timestamp_idx ON public.soopscope_sync_logs (timestamp DESC);
ALTER TABLE public.soopscope_sync_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.soopscope_sync_logs FROM anon, authenticated;
GRANT SELECT ON public.soopscope_sync_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.soopscope_sync_logs TO service_role;
CREATE POLICY "Public can read collection logs"
  ON public.soopscope_sync_logs FOR SELECT USING (true);
