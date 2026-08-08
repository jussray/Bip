create table if not exists public.control_room_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  commit_sha text not null,
  branch text not null default 'main',
  workflow_run_id text,
  deployed_at timestamptz not null default now(),
  baseline_started_at timestamptz,
  observation_ended_at timestamptz,
  status text not null default 'observing',
  issue_count integer not null default 0,
  error_count integer not null default 0,
  warning_count integer not null default 0,
  regression_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists control_room_releases_deployed_at_idx on public.control_room_releases (deployed_at desc);
create index if not exists control_room_releases_commit_sha_idx on public.control_room_releases (commit_sha);
alter table public.control_room_releases enable row level security;
drop policy if exists "Founder: releases" on public.control_room_releases;
create policy "Founder: releases" on public.control_room_releases for all using (public.is_founder()) with check (public.is_founder());
