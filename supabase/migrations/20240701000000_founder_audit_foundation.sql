begin;

-- Reconstructed foundation for repository replay.
--
-- Production evidence proves public.app_profiles and public.audit_events existed
-- before the tracked Control Room migrations that reference them, but their
-- creation migration is absent from the current repository history. Keep this
-- foundation deliberately minimal and fail-closed; later tracked migrations own
-- profile enrichment, runtime policies, grants hardening, and Control Room logic.
--
-- This migration must not be applied blindly to an existing linked project.
-- Before any remote history repair, verify that the live table shapes satisfy
-- this minimum contract and then reconcile the missing historical version via
-- the approved Supabase migration-history procedure.

create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text,
  can_view_audits boolean not null default false,
  can_manage_app boolean not null default false,
  exclude_from_analytics boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_profiles enable row level security;

-- Fresh installs start with no anonymous profile access. Authenticated SELECT is
-- required by later self/founder policy checks; RLS still denies rows until the
-- later profile-source migration installs the owner policy.
revoke all privileges on table public.app_profiles from anon;
grant select on table public.app_profiles to authenticated;

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  screen text,
  severity text not null default 'info',
  message text,
  metadata jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

-- Preserve the later repository contract: authenticated privileges exist, while
-- RLS policies decide which operations are allowed. No policy is created here,
-- so this foundation itself exposes no rows and permits no client writes.
revoke all privileges on table public.audit_events from anon;
grant select, insert, update, delete on table public.audit_events to authenticated;

comment on table public.app_profiles is
  'Foundational account capability table restored for ordered migration replay; later migrations add durable profile identity and current authorization policies.';

comment on table public.audit_events is
  'Foundational metadata-safe audit event table restored for ordered migration replay; later migrations install current authorization and Control Room behavior.';

commit;
