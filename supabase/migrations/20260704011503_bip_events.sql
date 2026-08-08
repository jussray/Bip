CREATE TABLE IF NOT EXISTS public.bip_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.bip_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bip_events: teen all" ON public.bip_events;
CREATE POLICY "bip_events: teen all"
  ON public.bip_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bip_events_user_time
  ON public.bip_events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_bip_events_user_type
  ON public.bip_events (user_id, event_type);

COMMENT ON TABLE public.bip_events IS
  'Append-only activity event ledger. One row per meaningful user action. Meta is intentionally minimal — no PII, no raw content.';
