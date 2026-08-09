-- 0003_oracle_parentlinks_period_safety.sql
-- Se'kret Bip — Phase 3 tables
-- All tables use auth.uid() RLS so anon sessions are fully scoped.
--
-- parent_links includes the verified historical preconditions that existed in
-- production before the recorded 20260628235058 migration ran. Production's
-- migration ledger never records creation of is_active/updated_at/quiet-hours,
-- removal of linked_at, or relaxation of invite/expiry nullability, while the
-- live table and later canonical RPCs depend on that shape.

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
  teen_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  invite_code text UNIQUE,
  expires_at timestamptz
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

CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  content_preview text,
  source_table text,
  source_id text,
  severity text NOT NULL DEFAULT 'low',
  reviewed_by_parent boolean NOT NULL DEFAULT false,
  parent_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
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
