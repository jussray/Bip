-- 0003_oracle_parentlinks_period_safety.sql
-- Se'kret Bip — Phase 3 tables + verified pre-ledger compatibility shape
--
-- Production records this version as applied, but retained bootstrap history and
-- the live schema prove parts of parent_links and safety_alerts predated the
-- recorded CREATE TABLE IF NOT EXISTS statements. Fresh replay therefore models
-- the verified compatibility union here rather than inventing a new historical
-- version that production never recorded.

CREATE TABLE IF NOT EXISTS public.oracle_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_id text NOT NULL,
  memory jsonb NOT NULL DEFAULT '{}',
  session_count integer NOT NULL DEFAULT 0,
  last_synced timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, personality_id)
);
ALTER TABLE public.oracle_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oracle_sessions: owner read" ON public.oracle_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "oracle_sessions: owner insert" ON public.oracle_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oracle_sessions: owner update" ON public.oracle_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oracle_sessions: owner delete" ON public.oracle_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  teen_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  invite_code text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  linked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parent_links: teen owner" ON public.parent_links FOR ALL USING (auth.uid() = teen_user_id) WITH CHECK (auth.uid() = teen_user_id);
CREATE POLICY "parent_links: parent read" ON public.parent_links FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "parent_links: parent accept" ON public.parent_links FOR UPDATE USING (auth.uid() = parent_user_id) WITH CHECK (status = 'active');
CREATE POLICY "parent_links: code lookup" ON public.parent_links FOR SELECT USING (status = 'pending' AND expires_at > now());

CREATE TABLE IF NOT EXISTS public.period_days (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
ALTER TABLE public.period_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "period_days: owner all" ON public.period_days FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- safety_alerts compatibility union
--
-- The retained pre-ledger bootstrap used UUID ids and teen/parent/source fields
-- with named CHECK constraints. The recorded Phase 3/runtime contract used
-- user_id/source_table/source_id/reviewed_by_parent/parent_notified_at. Current
-- production intentionally retains both sets so the Aug 8 reconciliation can
-- preserve rollback compatibility while making user_id authoritative.
CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teen_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_mood_id uuid REFERENCES public.moods(id) ON DELETE SET NULL,
  source_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  source_table text,
  source_id text,
  severity text NOT NULL,
  title text,
  summary text,
  is_read boolean NOT NULL DEFAULT false,
  reviewed_by_parent boolean NOT NULL DEFAULT false,
  parent_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT safety_alerts_alert_type_check
    CHECK (alert_type IN ('critical_mood','self_harm_keyword','panic_pattern','manual_sos')),
  CONSTRAINT safety_alerts_severity_check
    CHECK (severity IN ('medium','high','critical'))
);
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

-- Preserve both historical read-policy families until the canonical Aug 8
-- reconciliation replaces them with one read-only runtime contract.
CREATE POLICY "safety alerts insert teen only" ON public.safety_alerts
  FOR INSERT TO authenticated
  WITH CHECK (teen_user_id = auth.uid());
CREATE POLICY "safety alerts select linked teen or parent" ON public.safety_alerts
  FOR SELECT TO authenticated
  USING (teen_user_id = auth.uid() OR parent_user_id = auth.uid());
CREATE POLICY "safety alerts update parent or teen" ON public.safety_alerts
  FOR UPDATE TO authenticated
  USING (teen_user_id = auth.uid() OR parent_user_id = auth.uid())
  WITH CHECK (teen_user_id = auth.uid() OR parent_user_id = auth.uid());

CREATE POLICY "safety_alerts: teen read" ON public.safety_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "safety_alerts: linked parent read" ON public.safety_alerts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parent_links pl
    WHERE pl.teen_user_id = safety_alerts.user_id
      AND pl.parent_user_id = auth.uid()
      AND pl.status = 'active'
  )
);
CREATE POLICY "safety_alerts: linked parent update reviewed" ON public.safety_alerts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.parent_links pl
    WHERE pl.teen_user_id = safety_alerts.user_id
      AND pl.parent_user_id = auth.uid()
      AND pl.status = 'active'
  )
);
