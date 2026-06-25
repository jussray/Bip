-- Se'kret Bip — Supabase schema (Phase 2)
-- Safe to rerun in the Supabase SQL editor (or via supabase db push).
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
drop policy if exists "mood_history_self" on public.mood_history;
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
  created_at  timestamptz   not null default now()
);
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
