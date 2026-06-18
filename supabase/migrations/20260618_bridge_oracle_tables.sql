-- 20260618_bridge_oracle_tables.sql
-- Se'kret Bip — P6–P8 tables
--   • bridge_signals     — teen-to-parent metadata signal (NO message content)
--   • oracle_records     — upsert snapshot of a user's full OracleRecord per mode
--   • oracle_session_log — append-only per-session audit rows
--
-- NOTE: public.oracle_sessions already exists (0003_oracle_parentlinks_period_safety.sql)
-- and serves the companion-memory upsert path.  The new append-only log is
-- intentionally named oracle_session_log to avoid a schema conflict.
--
-- Run after 0003_oracle_parentlinks_period_safety.sql.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. bridge_signals
--    Teen-side send creates one row per Bridge tap.  Message text is NEVER
--    stored; only share_type / conv_mode / char_key metadata is persisted so
--    the parent-side can surface a gentle nudge.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bridge_signals (
  id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  teen_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  char_key      text        NOT NULL CHECK (char_key IN ('raylene', 'rylane')),
  share_type    text        NOT NULL,   -- 'mood' | 'thought' | 'need' | 'win'
  conv_mode     text,                   -- 'soft' | 'honest' | 'boundary' | 'safety' | NULL
  sent_at       timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bridge_signals_teen_user_id_idx
  ON public.bridge_signals (teen_user_id);

ALTER TABLE public.bridge_signals ENABLE ROW LEVEL SECURITY;

-- Teens may only insert their own rows.
DROP POLICY IF EXISTS "bridge_signals: teen insert" ON public.bridge_signals;
CREATE POLICY "bridge_signals: teen insert"
  ON public.bridge_signals FOR INSERT
  WITH CHECK (auth.uid() = teen_user_id);

-- Teens may read their own sent signals.
DROP POLICY IF EXISTS "bridge_signals: teen read" ON public.bridge_signals;
CREATE POLICY "bridge_signals: teen read"
  ON public.bridge_signals FOR SELECT
  USING (auth.uid() = teen_user_id);

-- Linked parents may read signals for their teen.
DROP POLICY IF EXISTS "bridge_signals: linked parent read" ON public.bridge_signals;
CREATE POLICY "bridge_signals: linked parent read"
  ON public.bridge_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.parent_links pl
      WHERE  pl.teen_user_id   = bridge_signals.teen_user_id
        AND  pl.parent_user_id = auth.uid()
        AND  pl.status         = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. oracle_records
--    One row per (user_id, mode).  Upserted on every saveOracleRecord call.
--    profile_snapshot holds the full JSON-serialised OracleRecord for
--    cross-device restore; dimension_summary is indexed for analytics.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.oracle_records (
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode              text        NOT NULL CHECK (mode IN ('teen', 'parent')),
  session_count     integer     NOT NULL DEFAULT 0,
  total_turns       integer     NOT NULL DEFAULT 0,
  last_session      timestamptz,
  dimension_summary jsonb       NOT NULL DEFAULT '{}',
  profile_snapshot  text        NOT NULL DEFAULT '',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mode)
);

ALTER TABLE public.oracle_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oracle_records: owner all" ON public.oracle_records;
CREATE POLICY "oracle_records: owner all"
  ON public.oracle_records FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. oracle_session_log
--    Append-only.  One row inserted per completed oracle session via
--    markSessionComplete().  Never updated or deleted by the client.
--    question_ids and dimension_summary enable session-level analytics.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.oracle_session_log (
  id                bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode              text        NOT NULL CHECK (mode IN ('teen', 'parent')),
  session_index     integer     NOT NULL DEFAULT 0,
  total_turns       integer     NOT NULL DEFAULT 0,
  question_ids      text[]      NOT NULL DEFAULT '{}',
  dimension_summary jsonb       NOT NULL DEFAULT '{}',
  profile_snapshot  text        NOT NULL DEFAULT '',
  completed_at      timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oracle_session_log_user_id_idx
  ON public.oracle_session_log (user_id);

CREATE INDEX IF NOT EXISTS oracle_session_log_user_mode_idx
  ON public.oracle_session_log (user_id, mode);

ALTER TABLE public.oracle_session_log ENABLE ROW LEVEL SECURITY;

-- Users may only insert their own session rows.
DROP POLICY IF EXISTS "oracle_session_log: owner insert" ON public.oracle_session_log;
CREATE POLICY "oracle_session_log: owner insert"
  ON public.oracle_session_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users may read their own session log.
DROP POLICY IF EXISTS "oracle_session_log: owner read" ON public.oracle_session_log;
CREATE POLICY "oracle_session_log: owner read"
  ON public.oracle_session_log FOR SELECT
  USING (auth.uid() = user_id);

-- Updates and deletes from the client are intentionally blocked (no policies).
