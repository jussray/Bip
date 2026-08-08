begin;

-- Reconstructed safety-alert table foundation for ordered repository replay.
--
-- `20260619_safety_scan.sql` alters public.safety_alerts but the repository's
-- tracked creation currently appears later in `20260622190209_remote_history.sql`.
-- The June 19 migration also documents a dependency on the missing historical
-- `0003_oracle_parentlinks_period_safety.sql` migration.
--
-- Restore only the exact pre-hardening table shape recorded in the later remote
-- history. Do not create policies here: the tracked remote-history migration
-- remains the authority for those policies, and CREATE TABLE IF NOT EXISTS will
-- safely no-op when it reaches this already-created table.

create table if not exists public.safety_alerts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null,
  content_preview text,
  source_table text,
  source_id text,
  severity text not null default 'low',
  reviewed_by_parent boolean not null default false,
  parent_notified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.safety_alerts enable row level security;

-- Keep the reconstructed foundation fail-closed until the later tracked
-- migration installs the historical teen/linked-parent policies.
revoke all privileges on table public.safety_alerts from anon, authenticated;

comment on table public.safety_alerts is
  'Reconstructed pre-hardening safety-alert foundation required by 20260619_safety_scan.sql; later migrations own current schema and authorization.';

commit;
