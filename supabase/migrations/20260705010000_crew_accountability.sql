-- Se'kret Bip — Phase 2 Crew Accountability
--
-- Creates crew_check_ins and crew_encouragements.
-- Owner: the teen who created the check-in.
-- Permitted readers: accepted crew members explicitly included at time of share.
-- Revocation: block or remove invalidates access immediately via RLS.
-- Parent access: none.

-- ─────────────────────────────────────────────────────────────
-- crew_check_ins
-- ─────────────────────────────────────────────────────────────
create table if not exists public.crew_check_ins (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  local_date    date not null,
  emoji         text not null check (emoji in ('great','okay','low','need_support','resting')),
  note          text,
  status        text not null default 'active' check (status in ('active','deleted')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

alter table public.crew_check_ins enable row level security;

-- Owner can read and write their own check-ins
create policy "crew_check_ins_owner_read" on public.crew_check_ins
  for select using (auth.uid() = owner_user_id);

create policy "crew_check_ins_owner_insert" on public.crew_check_ins
  for insert with check (auth.uid() = owner_user_id);

create policy "crew_check_ins_owner_update" on public.crew_check_ins
  for update using (auth.uid() = owner_user_id);

-- ─────────────────────────────────────────────────────────────
-- crew_check_in_shares
-- Links a check-in to a specific accepted crew member.
-- Revoked automatically when crew member is blocked/removed (see RLS below).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.crew_check_in_shares (
  id            uuid primary key default gen_random_uuid(),
  check_in_id   uuid not null references public.crew_check_ins(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  shared_with   uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'active' check (status in ('active','revoked')),
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (check_in_id, shared_with)
);

alter table public.crew_check_in_shares enable row level security;

-- Owner can manage their own shares
create policy "crew_check_in_shares_owner_read" on public.crew_check_in_shares
  for select using (auth.uid() = owner_user_id);

create policy "crew_check_in_shares_owner_insert" on public.crew_check_in_shares
  for insert with check (auth.uid() = owner_user_id);

create policy "crew_check_in_shares_owner_update" on public.crew_check_in_shares
  for update using (auth.uid() = owner_user_id);

-- Crew member can read a share only if:
-- 1. They are the shared_with recipient
-- 2. The share is active
-- 3. They are an accepted crew member of the owner (not blocked/removed)
create policy "crew_check_in_shares_crew_read" on public.crew_check_in_shares
  for select using (
    auth.uid() = shared_with
    and status = 'active'
    and exists (
      select 1 from public.crew_members cm
      where cm.user_id = owner_user_id
        and cm.member_id = auth.uid()
        and cm.connection_status = 'accepted'
    )
  );

-- Crew member read on the check-in itself (joined via share)
create policy "crew_check_ins_crew_read" on public.crew_check_ins
  for select using (
    exists (
      select 1 from public.crew_check_in_shares s
      join public.crew_members cm
        on cm.user_id = s.owner_user_id
       and cm.member_id = auth.uid()
       and cm.connection_status = 'accepted'
      where s.check_in_id = id
        and s.shared_with = auth.uid()
        and s.status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- crew_encouragements
-- Short preset reactions from crew member back to teen.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.crew_encouragements (
  id               uuid primary key default gen_random_uuid(),
  check_in_id      uuid not null references public.crew_check_ins(id) on delete cascade,
  sender_user_id   uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  preset_key       text not null,
  local_date       date not null,
  status           text not null default 'active' check (status in ('active','deleted')),
  created_at       timestamptz not null default now()
);

alter table public.crew_encouragements enable row level security;

-- Sender (crew member) can insert
create policy "crew_encouragements_sender_insert" on public.crew_encouragements
  for insert with check (
    auth.uid() = sender_user_id
    and exists (
      select 1 from public.crew_check_in_shares s
      join public.crew_members cm
        on cm.user_id = s.owner_user_id
       and cm.member_id = auth.uid()
       and cm.connection_status = 'accepted'
      where s.check_in_id = check_in_id
        and s.shared_with = auth.uid()
        and s.status = 'active'
    )
  );

-- Both parties can read
create policy "crew_encouragements_read" on public.crew_encouragements
  for select using (
    auth.uid() = sender_user_id or auth.uid() = recipient_user_id
  );

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger crew_check_ins_updated_at
    before update on public.crew_check_ins
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

do $$ begin
  create trigger crew_check_in_shares_updated_at
    before update on public.crew_check_in_shares
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;
