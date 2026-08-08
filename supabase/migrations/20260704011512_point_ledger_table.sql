CREATE TABLE IF NOT EXISTS public.point_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  bip_event_id bigint REFERENCES public.bip_events(id) ON DELETE SET NULL
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_point_tx_user ON public.point_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_user_type ON public.point_transactions (user_id, event_type);
