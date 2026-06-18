-- 20260619_safety_scan.sql
-- Se'kret Bip — Item 10 Safety Scan: schema fixes + trigger
--
-- Audit fixes applied (2026-06-19):
--   • Drop content_preview from safety_alerts — parents must never see content text
--   • Add scan_metadata jsonb (reduced shape only — no full moderation response)
--   • Add safety_flagged boolean to scanned tables
--   • Create s2tell_entries (Phase 5 — trigger commented until shipping)
--   • Enable pg_net idempotently
--   • trigger_safety_scan() — AFTER INSERT, SECURITY DEFINER, bigint-safe id cast
--   • Shared secret check via app.safety_scan_secret config
--
-- Depends on: 0001_init.sql, 0002_circle_v1.sql, 0003_oracle_parentlinks_period_safety.sql
-- Run after all prior migrations.

-- ── 1. pg_net extension ───────────────────────────────────────────────────────
-- Required for HTTP calls from triggers. Safe no-op if already present.
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ── 2. Fix safety_alerts — drop content_preview, add scan_metadata ───────────
--
-- AUDIT FIX: content_preview stored up to 200 chars of flagged teen content.
-- A false-positive flag would expose private journal text to a linked parent.
-- Drop it. Parents see only: severity, alert_type, source_table, created_at.
--
ALTER TABLE public.safety_alerts
  DROP COLUMN IF EXISTS content_preview;

-- scan_metadata stores reduced moderation result only:
--   { "flagged": bool, "top_category": text|null, "top_score": float, "provider": text }
-- Never stores full OpenAI response or any content text.
ALTER TABLE public.safety_alerts
  ADD COLUMN IF NOT EXISTS scan_metadata jsonb;

-- ── 3. Add safety_flagged to source tables ────────────────────────────────────
-- Allows the app layer to show a soft in-app wellness check-in to the teen
-- without revealing moderation details. Service role sets this; client reads it.

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS safety_flagged boolean NOT NULL DEFAULT false;

ALTER TABLE public.circle_posts
  ADD COLUMN IF NOT EXISTS safety_flagged boolean NOT NULL DEFAULT false;

ALTER TABLE public.public_circle_posts
  ADD COLUMN IF NOT EXISTS safety_flagged boolean NOT NULL DEFAULT false;

-- ── 4. s2tell_entries ─────────────────────────────────────────────────────────
-- Phase 5 table — private expression / confession space inside Pages.
-- Trigger is defined below but commented out until S2Tell ships.
CREATE TABLE IF NOT EXISTS public.s2tell_entries (
  id             bigint      NOT NULL,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body           text        NOT NULL,
  mood           text,
  safety_flagged boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.s2tell_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "s2tell: owner all" ON public.s2tell_entries;
CREATE POLICY "s2tell: owner all"
  ON public.s2tell_entries FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_s2tell_user_created
  ON public.s2tell_entries (user_id, created_at DESC);

-- ── 5. trigger_safety_scan() ──────────────────────────────────────────────────
--
-- Fires AFTER INSERT on each scanned table.
-- Column name is passed as TG_ARGV[0] so one function serves all tables.
-- record id is cast to TEXT — safe for bigint, bigserial, and uuid sources.
-- Shared secret is read from app.safety_scan_secret (superuser-set config);
-- if not configured the trigger skips silently (non-blocking).
--
-- SECURITY DEFINER so the function can read app.safety_scan_secret without
-- granting that config access to the calling session role.
-- search_path is pinned to public to prevent search_path injection.

CREATE OR REPLACE FUNCTION public.trigger_safety_scan()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _col_name  text    := TG_ARGV[0];   -- 'text' | 'body'
  _content   text;
  _fn_url    text;
  _secret    text;
BEGIN
  -- Resolve content from the correct column
  _content := CASE _col_name
    WHEN 'text' THEN NEW.text
    WHEN 'body' THEN NEW.body
    ELSE NULL
  END;

  -- Skip empty or whitespace-only content
  IF _content IS NULL OR length(trim(_content)) = 0 THEN
    RETURN NEW;
  END IF;

  -- Read config (set by superuser via ALTER DATABASE; not readable by users)
  _fn_url := current_setting('app.safety_scan_url',    true);
  _secret  := current_setting('app.safety_scan_secret', true);

  -- Skip silently if Edge Function URL not yet configured (pre-deploy safety)
  IF _fn_url IS NULL OR _fn_url = '' THEN
    RETURN NEW;
  END IF;

  -- Fire-and-forget HTTP POST via pg_net.
  -- AFTER INSERT means the user write is already committed — this is non-blocking.
  -- id is cast to text to handle bigint, bigserial, and uuid source tables safely.
  PERFORM extensions.http_post(
    url     := _fn_url,
    body    := jsonb_build_object(
                 'record_id',    NEW.id::text,
                 'user_id',      NEW.user_id::text,
                 'source_table', TG_TABLE_NAME::text,
                 'content',      _content
               )::text,
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'x-scan-secret', coalesce(_secret, '')
               )
  );

  RETURN NEW;
END;
$$;

-- ── 6. Attach triggers ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS safety_scan_journal ON public.journal_entries;
CREATE TRIGGER safety_scan_journal
  AFTER INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_safety_scan('text');

DROP TRIGGER IF EXISTS safety_scan_circle ON public.circle_posts;
CREATE TRIGGER safety_scan_circle
  AFTER INSERT ON public.circle_posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_safety_scan('text');

DROP TRIGGER IF EXISTS safety_scan_public_circle ON public.public_circle_posts;
CREATE TRIGGER safety_scan_public_circle
  AFTER INSERT ON public.public_circle_posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_safety_scan('text');

-- Uncomment when S2Tell ships (Phase 5):
-- DROP TRIGGER IF EXISTS safety_scan_s2tell ON public.s2tell_entries;
-- CREATE TRIGGER safety_scan_s2tell
--   AFTER INSERT ON public.s2tell_entries
--   FOR EACH ROW EXECUTE FUNCTION public.trigger_safety_scan('body');

-- ── 7. Config values — run MANUALLY after deploying Edge Function ─────────────
--
-- These must be set by a superuser (postgres role) in the Supabase SQL editor.
-- They are NOT readable by anon or authenticated roles.
-- Replace placeholders with real values after `supabase functions deploy safety-scan`.
--
-- ALTER DATABASE postgres
--   SET app.safety_scan_url    = 'https://<project>.supabase.co/functions/v1/safety-scan';
-- ALTER DATABASE postgres
--   SET app.safety_scan_secret = '<your-random-secret-min-32-chars>';
--
-- Also set the Supabase Edge Function secret:
--   supabase secrets set SAFETY_SCAN_SECRET=<same-value-as-above>
