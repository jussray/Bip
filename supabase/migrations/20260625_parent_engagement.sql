-- 20260625_parent_engagement.sql
-- Se'kret Bip — parent_engagement table
--
-- Tracks a parent's engagement stats: notes sent, tips read, days active,
-- and whether they've used Bridge. Read by fetchParentEngagement() in sync.ts
-- to populate the parent Growth/Insights views.
--
-- One row per parent_user_id (upsert on each engagement event).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parent_engagement (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tips_read       int         NOT NULL DEFAULT 0,
  days_active     int         NOT NULL DEFAULT 0,
  bridge_used     boolean     NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS — parent sees only their own row
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.parent_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_engagement_select_own"
  ON public.parent_engagement FOR SELECT
  USING (auth.uid() = parent_user_id);

CREATE POLICY "parent_engagement_insert_own"
  ON public.parent_engagement FOR INSERT
  WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "parent_engagement_update_own"
  ON public.parent_engagement FOR UPDATE
  USING (auth.uid() = parent_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Index for fast single-row lookups
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_parent_engagement_parent_user_id
  ON public.parent_engagement (parent_user_id);
