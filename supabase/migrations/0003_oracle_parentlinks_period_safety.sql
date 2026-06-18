-- 0003_oracle_parentlinks_period_safety.sql
-- Se'kret Bip — Phase 3 tables
--   • oracle_sessions      — companion memory cloud sync
--   • parent_links         — teen ↔ parent invite/link system
--   • period_days          — period calendar cloud sync
--   • safety_alerts        — content safety flags + parent notifications
--
-- All tables use auth.uid() RLS so anon sessions are fully scoped.
-- Run after 0002_circle_v1.sql.

-- ── oracle_sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oracle_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_id  text        NOT NULL,                      -- 'teen' | 'parent'
  memory          jsonb       NOT NULL DEFAULT '{}',         -- full memory snapshot
  session_count   integer     NOT NULL DEFAULT 0,
  last_synced     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, personality_id)
);

ALTER TABLE public.oracle_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oracle_sessions: owner read"
  ON public.oracle_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "oracle_sessions: owner insert"
  ON public.oracle_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oracle_sessions: owner update"
  ON public.oracle_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oracle_sessions: owner delete"
  ON public.oracle_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ── parent_links ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parent_links (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  teen_user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code     text        NOT NULL UNIQUE,               -- 6-char code
  status          text        NOT NULL DEFAULT 'pending',    -- 'pending' | 'active' | 'revoked'
  linked_at       timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;

-- Teen can create their own invite and read/revoke their own link
CREATE POLICY "parent_links: teen owner"
  ON public.parent_links FOR ALL
  USING (auth.uid() = teen_user_id)
  WITH CHECK (auth.uid() = teen_user_id);

-- Parent can read + accept a link addressed to them
CREATE POLICY "parent_links: parent read"
  ON public.parent_links FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "parent_links: parent accept"
  ON public.parent_links FOR UPDATE
  USING (auth.uid() = parent_user_id)
  WITH CHECK (status = 'active');

-- Anyone can look up a pending invite by code (needed for redemption flow)
CREATE POLICY "parent_links: code lookup"
  ON public.parent_links FOR SELECT
  USING (status = 'pending' AND expires_at > now());

-- ── period_days ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.period_days (
  id         bigserial   PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day        date        NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.period_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "period_days: owner all"
  ON public.period_days FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── safety_alerts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id                  bigserial   PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type          text        NOT NULL,  -- 'keyword' | 'image' | 'manual'
  content_preview     text,                 -- first 200 chars of flagged content
  source_table        text,                 -- 'journal_entries' | 'posts' | 'voice_notes'
  source_id           text,                 -- row id of flagged content
  severity            text        NOT NULL DEFAULT 'low',   -- 'low' | 'medium' | 'high'
  reviewed_by_parent  boolean     NOT NULL DEFAULT false,
  parent_notified_at  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

-- Teen (the owner) can read their own alerts but cannot delete/update them
CREATE POLICY "safety_alerts: teen read"
  ON public.safety_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts come from Edge Function / server-side logic (service role).
-- Direct client inserts are intentionally blocked by omitting an INSERT policy.

-- Parent can read alerts for linked teens
CREATE POLICY "safety_alerts: linked parent read"
  ON public.safety_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_links pl
      WHERE pl.teen_user_id = safety_alerts.user_id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'active'
    )
  );

CREATE POLICY "safety_alerts: linked parent update reviewed"
  ON public.safety_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_links pl
      WHERE pl.teen_user_id = safety_alerts.user_id
        AND pl.parent_user_id = auth.uid()
        AND pl.status = 'active'
    )
  );
