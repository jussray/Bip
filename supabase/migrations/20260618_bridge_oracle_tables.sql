-- 20260618_bridge_oracle_tables.sql
-- Se'kret Bip — P6–P8 tables
--   • bridge_signals   — teen-to-parent metadata signal (NO message content)
--   • oracle_records   — upsert snapshot of a user's full OracleRecord per mode
--   • oracle_sessions  — append-only per-session log (extends table from 0003)
--
-- oracle_sessions was first created in 0003_oracle_parentlinks_period_safety.sql
-- for companion-memory upserts.  This migration adds the columns needed by the
-- P7/P8 markSessionComplete() append-only insert path and updates its RLS
-- policies to match.  All DDL is idempotent (IF NOT EXISTS / IF EXISTS guards).
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
-- 3. oracle_sessions  (extends existing table from 0003)
--    The 0003 migration created oracle_sessions for companion-memory upserts
--    (personality_id + memory columns).  P7/P8 adds an append-only insert
--    path via markSessionComplete() that writes mode, session_index,
--    total_turns, question_ids, dimension_summary, profile_snapshot, and
--    completed_at.  We add those columns idempotently and refresh RLS policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add P7/P8 columns (safe no-ops if already present).
ALTER TABLE public.oracle_sessions
  ADD COLUMN IF NOT EXISTS mode              text,
  ADD COLUMN IF NOT EXISTS session_index     integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_turns       integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS question_ids      text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dimension_summary jsonb       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_snapshot  text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS completed_at      timestamptz;

CREATE INDEX IF NOT EXISTS oracle_sessions_user_id_idx
  ON public.oracle_sessions (user_id);

CREATE INDEX IF NOT EXISTS oracle_sessions_user_mode_idx
  ON public.oracle_sessions (user_id, mode);

ALTER TABLE public.oracle_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (created without guards in 0003) before recreating.
DROP POLICY IF EXISTS "oracle_sessions: owner read"   ON public.oracle_sessions;
DROP POLICY IF EXISTS "oracle_sessions: owner insert" ON public.oracle_sessions;
DROP POLICY IF EXISTS "oracle_sessions: owner update" ON public.oracle_sessions;
DROP POLICY IF EXISTS "oracle_sessions: owner delete" ON public.oracle_sessions;

-- Users may read their own rows (upsert + append paths).
CREATE POLICY "oracle_sessions: owner read"
  ON public.oracle_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users may insert their own rows (markSessionComplete append path).
CREATE POLICY "oracle_sessions: owner insert"
  ON public.oracle_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users may update their own rows (companion-memory upsert path from 0003).
CREATE POLICY "oracle_sessions: owner update"
  ON public.oracle_sessions FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users may delete their own rows.
CREATE POLICY "oracle_sessions: owner delete"
  ON public.oracle_sessions FOR DELETE
  USING (auth.uid() = user_id);
