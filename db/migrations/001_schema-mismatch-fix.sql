-- ───────────────────────────────────────────────────────────────────────────
-- Se'kret Bip — Migration 001: schema mismatch fix
-- ───────────────────────────────────────────────────────────────────────────
-- Run once in Supabase SQL editor (or via CLI: supabase db push).
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS guards).
-- ───────────────────────────────────────────────────────────────────────────

-- 1. journal_entries: add sekret_reply (nullable — UI-only transient state,
--    column reserved for future optional cloud persistence)
alter table public.journal_entries
  add column if not exists sekret_reply text;

-- 2. circle_posts: add columns that sync.ts already writes
alter table public.circle_posts
  add column if not exists circle_tag text,
  add column if not exists post_mood  text,
  add column if not exists media_kind text;

-- 3. parent_circle_posts: create table (parent-side Circle wall)
create table if not exists public.parent_circle_posts (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  id          bigint      not null,
  text        text        not null,
  date        text        not null,
  time        text        not null,
  reactions   jsonb       not null default '{"beenThere":0,"solidarity":0,"reminder":0,"needed":0,"strength":0}'::jsonb,
  circle_tag  text,
  created_at  timestamptz not null default bip_now(),
  primary key (user_id, id)
);

-- 4. RLS on parent_circle_posts (owner-only, matches every other table)
alter table public.parent_circle_posts enable row level security;

drop policy if exists "parent_circle_posts_owner_select" on public.parent_circle_posts;
drop policy if exists "parent_circle_posts_owner_insert" on public.parent_circle_posts;
drop policy if exists "parent_circle_posts_owner_update" on public.parent_circle_posts;
drop policy if exists "parent_circle_posts_owner_delete" on public.parent_circle_posts;

create policy "parent_circle_posts_owner_select"
  on public.parent_circle_posts for select
  using (auth.uid() = user_id);

create policy "parent_circle_posts_owner_insert"
  on public.parent_circle_posts for insert
  with check (auth.uid() = user_id);

create policy "parent_circle_posts_owner_update"
  on public.parent_circle_posts for update
  using (auth.uid() = user_id);

create policy "parent_circle_posts_owner_delete"
  on public.parent_circle_posts for delete
  using (auth.uid() = user_id);

-- 5. Index
create index if not exists idx_parent_circle_user_date
  on public.parent_circle_posts (user_id, date);

-- ───────────────────────────────────────────────────────────────────────────
-- Storage note: Supabase Storage is NOT wired in this app. No bucket uploads
-- or storage.from() calls exist in the codebase. db/storage.sql is not
-- included here. Add it only when upload is actually implemented.
-- ───────────────────────────────────────────────────────────────────────────
