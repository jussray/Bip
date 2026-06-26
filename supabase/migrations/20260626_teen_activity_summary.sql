-- 20260626_teen_activity_summary.sql
-- Teen writes aggregated wellbeing stats; linked parent can read.
-- Never exposes journal content, voice recordings, or raw entries.
-- Privacy-first: parent sees streak/tier/session count only.

CREATE TABLE IF NOT EXISTS public.teen_activity_summary (
  user_id        uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_days    integer     NOT NULL DEFAULT 0,
  session_count  integer     NOT NULL DEFAULT 0,  -- total comfort sessions all time
  points_tier    text        NOT NULL DEFAULT 't0', -- 't0'–'t4' soft tier label
  last_active_at timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teen_activity_summary ENABLE ROW LEVEL SECURITY;

-- Teen owns and writes their own summary
CREATE POLICY "teen_activity_summary: teen all"
  ON public.teen_activity_summary FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Linked parent can read (never write) their teen's summary
CREATE POLICY "teen_activity_summary: parent read"
  ON public.teen_activity_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_links pl
      WHERE pl.parent_user_id = auth.uid()
        AND pl.teen_user_id   = teen_activity_summary.user_id
        AND pl.status         = 'active'
    )
  );

-- Fast lookup when parent queries by teen user_id
CREATE INDEX IF NOT EXISTS idx_teen_activity_summary_user
  ON public.teen_activity_summary (user_id);
