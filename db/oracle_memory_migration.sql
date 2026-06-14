-- ─────────────────────────────────────────────────────────────────────────────
-- Oracle Memory Migration — Phase 1A
-- Creates oracle_profiles table with owner-scoped RLS.
-- Run once in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.oracle_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  owner           text not null check (owner in ('teen', 'parent')),
  understandings  jsonb not null default '[]'::jsonb,
  self_trust_evidence jsonb not null default '[]'::jsonb,
  conversation_count integer not null default 0,
  last_active_at  timestamptz not null default now(),
  schema_version  integer not null default 2,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One profile per user per owner role
create unique index if not exists oracle_profiles_user_owner_idx
  on public.oracle_profiles (user_id, owner);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists oracle_profiles_updated_at on public.oracle_profiles;
create trigger oracle_profiles_updated_at
  before update on public.oracle_profiles
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.oracle_profiles enable row level security;

-- SELECT: user can only read their own profiles
create policy "oracle_profiles_select"
  on public.oracle_profiles for select
  using (auth.uid() = user_id);

-- INSERT: user can only insert their own profiles
create policy "oracle_profiles_insert"
  on public.oracle_profiles for insert
  with check (auth.uid() = user_id);

-- UPDATE: user can only update their own profiles
create policy "oracle_profiles_update"
  on public.oracle_profiles for update
  using (auth.uid() = user_id);

-- DELETE: user can only delete their own profiles
create policy "oracle_profiles_delete"
  on public.oracle_profiles for delete
  using (auth.uid() = user_id);

-- No service role bypass — Oracle data is private by design.
-- Not even the app backend can read a user's Oracle profile.
-- Access is strictly owner-scoped.
