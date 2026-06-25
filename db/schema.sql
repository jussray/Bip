-- Se'kret Bip — Supabase schema (Phase 2)
-- Run once in the Supabase SQL editor (or via supabase db push).
-- All tables use Row Level Security scoped to auth.uid().

-- ── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── mood_history ────────────────────────────────────────────────────────────
create table if not exists public.mood_history (
  id          bigint        primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  mood        text          not null,
  date        text          not null,
  time        text          not null,
  created_at  timestamptz   not null default now()
);
alter table public.mood_history enable row level security;
create policy "mood_history_self" on public.mood_history
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── journal_entries ─────────────────────────────────────────────────────────
create table if not exists public.journal_entries (
  id            bigint        primary key,
  user_id       uuid          not null references auth.users(id) on delete cascade,
  text          text          not null,
  mood          text          not null,
  date          text          not null,
  time          text          not null,
  sekret_reply  text,
  created_at    timestamptz   not null default now()
);
alter table public.journal_entries enable row level security;
create policy "journal_entries_self" on public.journal_entries
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── circle_posts ────────────────────────────────────────────────────────────
create table if not exists public.circle_posts (
  id          bigint        primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  text        text          not null,
  date        text,
  time        text,
  reactions   jsonb         not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  circle_tag  text,
  post_mood   text,
  media_kind  text,
  created_at  timestamptz   not null default now()
);
alter table public.circle_posts enable row level security;
create policy "circle_posts_self" on public.circle_posts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── parent_circle_posts ─────────────────────────────────────────────────────
-- IMPORTANT: reactions shape for the *parent* circle is different from the
-- teen circle. Keys: beenThere, solidarity, reminder, needed, strength.
-- The teen circle uses: felt, comfort, proud, stay.
create table if not exists public.parent_circle_posts (
  id          bigint        primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  text        text          not null,
  date        text          not null,
  time        text          not null,
  reactions   jsonb         not null default '{"beenThere":0,"solidarity":0,"reminder":0,"needed":0,"strength":0}'::jsonb,
  circle_tag  text,
  created_at  timestamptz   not null default now()
);
alter table public.parent_circle_posts enable row level security;
create policy "parent_circle_posts_self" on public.parent_circle_posts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── voice_notes ─────────────────────────────────────────────────────────────
create table if not exists public.voice_notes (
  id          bigint        primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  title       text          not null,
  date        text          not null,
  time        text          not null,
  duration    text          not null,
  created_at  timestamptz   not null default now()
);
alter table public.voice_notes enable row level security;
create policy "voice_notes_self" on public.voice_notes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── comfort_sessions ────────────────────────────────────────────────────────
create table if not exists public.comfort_sessions (
  id          bigint        primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  type        text          not null,
  mood        text,
  date        text          not null,
  time        text          not null,
  created_at  timestamptz   not null default now()
);
alter table public.comfort_sessions enable row level security;
create policy "comfort_sessions_self" on public.comfort_sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── crew_members ────────────────────────────────────────────────────────────
create table if not exists public.crew_members (
  id           bigint        primary key,
  user_id      uuid          not null references auth.users(id) on delete cascade,
  name         text          not null,
  emoji        text          not null,
  commitment   text          not null,
  cadence      text          not null,
  invite_code  text          not null,
  added_at     timestamptz   not null,
  created_at   timestamptz   not null default now()
);
alter table public.crew_members enable row level security;
create policy "crew_members_self" on public.crew_members
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── crew_check_ins ──────────────────────────────────────────────────────────
create table if not exists public.crew_check_ins (
  id          bigint        primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  member_id   bigint        not null,
  note        text          not null,
  mood        text,
  date        text          not null,
  time        text          not null,
  created_at  timestamptz   not null default now()
);
alter table public.crew_check_ins enable row level security;
create policy "crew_check_ins_self" on public.crew_check_ins
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── bip_points ──────────────────────────────────────────────────────────────
create table if not exists public.bip_points (
  id           bigserial     primary key,
  user_id      uuid          not null references auth.users(id) on delete cascade,
  total        integer       not null,
  captured_at  timestamptz   not null default now()
);
alter table public.bip_points enable row level security;
create policy "bip_points_self" on public.bip_points
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── room_memory ─────────────────────────────────────────────────────────────
-- Single row per user (upsert on user_id). Tracks Room state across devices.
create table if not exists public.room_memory (
  user_id      uuid          primary key references auth.users(id) on delete cascade,
  character    text          not null default 'raylene',
  last_visit   text          not null default '',
  last_hotspot text          not null default '',
  last_summon  text          not null default '',
  visit_count  integer       not null default 0,
  updated_at   timestamptz   not null default now()
);
alter table public.room_memory enable row level security;
create policy "room_memory_self" on public.room_memory
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── accounts ─────────────────────────────────────────────────────────────────
-- Private identity record — one row per authenticated user.
-- real identity (email, first_name) is separated from public Bip identity
-- (anonymous_handle, bip_id) which is safe to surface in social contexts.
create table if not exists public.accounts (
  id                uuid          primary key references auth.users(id) on delete cascade,
  email             text          not null,
  first_name        text          not null,
  side              text          not null check (side in ('teen', 'guardian')),
  age_gate_status   text          not null check (age_gate_status in ('teen', 'guardian')),
  anonymous_handle  text          not null,
  bip_id            text          not null unique,
  avatar_key        text          not null default 'soft',
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);
alter table public.accounts enable row level security;
create policy "accounts_select" on public.accounts
  for select using (auth.uid() = id);
create policy "accounts_insert" on public.accounts
  for insert with check (auth.uid() = id);
create policy "accounts_update" on public.accounts
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── parent_teen_invites ───────────────────────────────────────────────────────
-- Teen-generated invite codes used to initiate guardian linking.
-- Codes are single-use; expires_at enforces time bounds.
create table if not exists public.parent_teen_invites (
  id          uuid          primary key default gen_random_uuid(),
  teen_id     uuid          not null references auth.users(id) on delete cascade,
  invite_code text          not null unique,
  used        boolean       not null default false,
  expires_at  timestamptz   not null default (now() + interval '48 hours'),
  created_at  timestamptz   not null default now()
);
alter table public.parent_teen_invites enable row level security;
create policy "parent_teen_invites_teen_select" on public.parent_teen_invites
  for select using (auth.uid() = teen_id);
create policy "parent_teen_invites_teen_insert" on public.parent_teen_invites
  for insert with check (auth.uid() = teen_id);
-- Guardians need to look up an invite by code to claim it
create policy "parent_teen_invites_guardian_claim" on public.parent_teen_invites
  for select using (used = false and expires_at > now());

-- ── parent_teen_links ─────────────────────────────────────────────────────────
-- Approved guardian-teen relationships. Guardian requests start pending;
-- teen must approve. permissions[] controls what the guardian can see.
create table if not exists public.parent_teen_links (
  id           uuid          primary key default gen_random_uuid(),
  teen_id      uuid          not null references auth.users(id) on delete cascade,
  guardian_id  uuid          not null references auth.users(id) on delete cascade,
  invite_code  text          not null,
  status       text          not null default 'pending' check (status in ('pending', 'approved', 'blocked', 'removed')),
  permissions  text[]        not null default '{}',
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now(),
  unique (teen_id, guardian_id)
);
alter table public.parent_teen_links enable row level security;
create policy "parent_teen_links_teen_select" on public.parent_teen_links
  for select using (auth.uid() = teen_id);
create policy "parent_teen_links_guardian_select" on public.parent_teen_links
  for select using (auth.uid() = guardian_id);
create policy "parent_teen_links_teen_manage" on public.parent_teen_links
  for all using (auth.uid() = teen_id) with check (auth.uid() = teen_id);
create policy "parent_teen_links_guardian_request" on public.parent_teen_links
  for insert with check (auth.uid() = guardian_id);

-- ── teen_guardian_shares ──────────────────────────────────────────────────────
-- Specific content a teen has explicitly shared with an approved guardian.
-- Reads are scoped: teen sees their own shares; guardian sees only approved links.
create table if not exists public.teen_guardian_shares (
  id           uuid          primary key default gen_random_uuid(),
  link_id      uuid          not null references public.parent_teen_links(id) on delete cascade,
  teen_id      uuid          not null references auth.users(id) on delete cascade,
  guardian_id  uuid          not null references auth.users(id) on delete cascade,
  share_kind   text          not null,
  summary      text          not null,
  source_id    text,
  created_at   timestamptz   not null default now()
);
alter table public.teen_guardian_shares enable row level security;
create policy "teen_guardian_shares_teen_select" on public.teen_guardian_shares
  for select using (auth.uid() = teen_id);
create policy "teen_guardian_shares_linked_guardian_select" on public.teen_guardian_shares
  for select using (
    auth.uid() = guardian_id
    and exists (
      select 1 from public.parent_teen_links l
      where l.id = link_id and l.status = 'approved' and auth.uid() = l.guardian_id
    )
  );
create policy "teen_guardian_shares_teen_insert" on public.teen_guardian_shares
  for insert with check (auth.uid() = teen_id);
