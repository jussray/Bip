-- Se'kret Bip — Supabase schema (Phase 2)
-- Safe to rerun in the Supabase SQL editor (or via supabase db push).
-- All tables use Row Level Security scoped to auth.uid().

-- ── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── accounts ────────────────────────────────────────────────────────────────
-- Private profile owned by the signed-in user. Real identity stays owner-only;
-- public/community surfaces should use anonymous_handle, avatar_key, and bip_id.
create table if not exists public.accounts (
  id                uuid        primary key references auth.users(id) on delete cascade,
  email             text        not null,
  first_name        text        not null,
  side              text        not null check (side in ('teen', 'guardian')),
  age_gate_status   text        not null check (age_gate_status in ('teen', 'guardian')),
  anonymous_handle  text        not null,
  avatar_key        text        not null default 'soft',
  bip_id            text        not null unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.accounts enable row level security;
drop policy if exists "accounts_self" on public.accounts;
create policy "accounts_self" on public.accounts
  using (auth.uid() = id) with check (auth.uid() = id);

-- Privacy rule: do not add broad select policies for accounts. Friend discovery
-- should happen by invite/QR/Bip ID flow and must not expose email or first_name.

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
drop policy if exists "mood_history_self" on public.mood_history;
create policy "mood_history_self" on public.mood_history
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── journal_entries ─────────────────────────────────────────────────────────
-- id is client-generated (Date.now() — see src/hooks/useAppActions.ts), so it
-- is only unique per user, not globally. Primary key must be (user_id, id),
-- matching supabase/migrations/0001_init.sql.
create table if not exists public.journal_entries (
  id            bigint        not null,
  user_id       uuid          not null references auth.users(id) on delete cascade,
  text          text          not null,
  mood          text          not null,
  date          text          not null,
  time          text          not null,
  sekret_reply  text,
  created_at    timestamptz   not null default now(),
  primary key (user_id, id)
);
alter table public.journal_entries enable row level security;
drop policy if exists "journal_entries_self" on public.journal_entries;
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
  anonymous_name text,
  avatar_key text,
  visibility text not null default 'public_circle' check (visibility in ('public_circle', 'friends_only')),
  identity_context text not null default 'public_circle' check (identity_context in ('public_circle', 'trusted_friend')),
  created_at  timestamptz   not null default now()
);
alter table public.circle_posts add column if not exists anonymous_name text;
alter table public.circle_posts add column if not exists avatar_key text;
alter table public.circle_posts add column if not exists visibility text not null default 'public_circle';
alter table public.circle_posts add column if not exists identity_context text not null default 'public_circle';
do $$ begin
  alter table public.circle_posts add constraint circle_posts_visibility_check
    check (visibility in ('public_circle', 'friends_only'));
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.circle_posts add constraint circle_posts_identity_context_check
    check (identity_context in ('public_circle', 'trusted_friend'));
exception when duplicate_object then null;
end $$;
alter table public.circle_posts enable row level security;
drop policy if exists "circle_posts_self" on public.circle_posts;
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
drop policy if exists "parent_circle_posts_self" on public.parent_circle_posts;
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
drop policy if exists "voice_notes_self" on public.voice_notes;
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
drop policy if exists "comfort_sessions_self" on public.comfort_sessions;
create policy "comfort_sessions_self" on public.comfort_sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── crew_members ────────────────────────────────────────────────────────────
-- id is client-generated (Date.now() — see src/hooks/useAppActions.ts), so it
-- is only unique per user, not globally. Primary key must be (user_id, id),
-- matching supabase/migrations/0001_init.sql.
create table if not exists public.crew_members (
  id           bigint        not null,
  user_id      uuid          not null references auth.users(id) on delete cascade,
  name         text          not null,
  emoji        text          not null,
  commitment   text          not null,
  cadence      text          not null,
  invite_code  text          not null,
  bip_id       text,
  connection_status text not null default 'pending' check (connection_status in ('pending', 'accepted', 'blocked', 'removed')),
  added_at     timestamptz   not null,
  created_at   timestamptz   not null default now(),
  primary key (user_id, id)
);
alter table public.crew_members add column if not exists bip_id text;
alter table public.crew_members add column if not exists connection_status text not null default 'pending';
do $$ begin
  alter table public.crew_members add constraint crew_members_connection_status_check
    check (connection_status in ('pending', 'accepted', 'blocked', 'removed'));
exception when duplicate_object then null;
end $$;
alter table public.crew_members enable row level security;
drop policy if exists "crew_members_self" on public.crew_members;
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
drop policy if exists "crew_check_ins_self" on public.crew_check_ins;
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
drop policy if exists "bip_points_self" on public.bip_points;
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
drop policy if exists "room_memory_self" on public.room_memory;
create policy "room_memory_self" on public.room_memory
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Parent ↔ Teen linking ──────────────────────────────────────────────────
-- Parents/guardians cannot search teen profiles by real name or email. A teen
-- generates an invite/QR code; a guardian can create only a pending request;
-- the teen must approve before any shared teen content is visible.
create table if not exists public.parent_teen_invites (
  id          uuid        primary key default uuid_generate_v4(),
  teen_id     uuid        not null references auth.users(id) on delete cascade,
  invite_code text        not null unique,
  status      text        not null default 'pending' check (status in ('pending', 'approved', 'blocked', 'removed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (teen_id, invite_code)
);
alter table public.parent_teen_invites enable row level security;
drop policy if exists "parent_teen_invites_teen_self" on public.parent_teen_invites;
create policy "parent_teen_invites_teen_self" on public.parent_teen_invites
  using (auth.uid() = teen_id) with check (auth.uid() = teen_id);
drop policy if exists "parent_teen_invites_guardian_code_lookup" on public.parent_teen_invites;
create policy "parent_teen_invites_guardian_code_lookup" on public.parent_teen_invites
  for select using (status = 'pending');

create table if not exists public.parent_teen_links (
  id          uuid        primary key default uuid_generate_v4(),
  teen_id     uuid        not null references auth.users(id) on delete cascade,
  guardian_id uuid        not null references auth.users(id) on delete cascade,
  invite_id   uuid        references public.parent_teen_invites(id) on delete set null,
  status      text        not null default 'pending' check (status in ('pending', 'approved', 'blocked', 'removed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (teen_id, guardian_id)
);
alter table public.parent_teen_links enable row level security;
drop policy if exists "parent_teen_links_self" on public.parent_teen_links;
create policy "parent_teen_links_self" on public.parent_teen_links
  using (auth.uid() = teen_id or auth.uid() = guardian_id)
  with check (auth.uid() = teen_id or auth.uid() = guardian_id);

create table if not exists public.teen_guardian_shares (
  id          uuid        primary key default uuid_generate_v4(),
  teen_id     uuid        not null references auth.users(id) on delete cascade,
  guardian_id uuid        not null references auth.users(id) on delete cascade,
  link_id     uuid        references public.parent_teen_links(id) on delete cascade,
  share_key   text        not null,
  allowed     boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (teen_id, guardian_id, share_key)
);
alter table public.teen_guardian_shares enable row level security;
drop policy if exists "teen_guardian_shares_self" on public.teen_guardian_shares;
create policy "teen_guardian_shares_self" on public.teen_guardian_shares
  using (auth.uid() = teen_id or auth.uid() = guardian_id)
  with check (auth.uid() = teen_id or auth.uid() = guardian_id);
