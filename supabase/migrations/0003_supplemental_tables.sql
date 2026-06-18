-- Se'kret Bip — Supplemental tables migration
-- Run after 0001_init.sql and 0002_circle_v1.sql.
--
-- Covers:
--   1. Fix parent_circle_posts reactions default (beenThere/solidarity/... not felt/comfort/...)
--   2. Add shared-read RLS to parent_circle_posts so the Parent Circle feed works
--   3. parent_links — connects a teen account to a parent account
--   4. circle_members — tracks circle membership (supplement to circle_friendships)
--   5. circles — generic named circle containers (V2 model, forward-compat)
--   6. posts — generic post rows keyed to a circle (V2 model, forward-compat)
--   7. post_reactions — one reaction per user per post (V2 model, forward-compat)
--   8. post_comments — threaded comments on posts (forward-compat)
--   9. moods — reference table for mood taxonomy
--  10. parent_mood_summaries — weekly mood digest visible to linked parent
--  11. safety_alerts — high-priority safety escalations

-- ── 1. Fix parent_circle_posts reactions default ─────────────────────────────
alter table public.parent_circle_posts
  alter column reactions set default '{"beenThere":0,"solidarity":0,"reminder":0,"needed":0,"strength":0}'::jsonb;

-- ── 2. Add shared-read policy for parent_circle_posts ───────────────────────
-- Parents need to see community posts — not just their own.
-- user_id is stored for moderation but stripped by the app layer before display.
drop policy if exists "parent_circle_posts_owner_select" on public.parent_circle_posts;
create policy "parent_circle_posts_owner_select" on public.parent_circle_posts
  for select using (auth.uid() is not null);
-- Keep the owner-only insert/update/delete policies from 0001.

-- ── 3. parent_links ──────────────────────────────────────────────────────────
-- Connects a teen's auth.users row to a parent's auth.users row.
-- Requires mutual acceptance (status: pending → accepted).
-- status: 'pending' | 'accepted' | 'revoked'
create table if not exists public.parent_links (
  id             bigserial     primary key,
  teen_user_id   uuid          not null references auth.users(id) on delete cascade,
  parent_user_id uuid          not null references auth.users(id) on delete cascade,
  status         text          not null default 'pending' check (status in ('pending','accepted','revoked')),
  invite_code    text,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now(),
  unique (teen_user_id, parent_user_id)
);
alter table public.parent_links enable row level security;
-- Either party can read their own link.
create policy "parent_links_self" on public.parent_links
  for select using (auth.uid() = teen_user_id or auth.uid() = parent_user_id);
-- Teen initiates link; parent accepts.
create policy "parent_links_insert" on public.parent_links
  for insert with check (auth.uid() = teen_user_id);
create policy "parent_links_update" on public.parent_links
  for update using (auth.uid() = teen_user_id or auth.uid() = parent_user_id);
create index if not exists idx_parent_links_teen   on public.parent_links (teen_user_id);
create index if not exists idx_parent_links_parent on public.parent_links (parent_user_id);

-- ── 4. circle_members ────────────────────────────────────────────────────────
-- Supplement to circle_friendships: tracks membership in a named circle.
-- circle_id references the circles table (below).
create table if not exists public.circle_members (
  id         bigserial     primary key,
  circle_id  bigint        not null,
  user_id    uuid          not null references auth.users(id) on delete cascade,
  role       text          not null default 'member' check (role in ('owner','member')),
  joined_at  timestamptz   not null default now(),
  unique (circle_id, user_id)
);
alter table public.circle_members enable row level security;
create policy "circle_members_self" on public.circle_members
  for select using (auth.uid() = user_id);
create policy "circle_members_insert" on public.circle_members
  for insert with check (auth.uid() = user_id);
create policy "circle_members_delete" on public.circle_members
  for delete using (auth.uid() = user_id);
create index if not exists idx_circle_members_circle on public.circle_members (circle_id);
create index if not exists idx_circle_members_user   on public.circle_members (user_id);

-- ── 5. circles ───────────────────────────────────────────────────────────────
-- Named circle containers (V2 model). Each user has up to 3 circles (public/friends/crew).
-- kind: 'public' | 'friends' | 'crew'
create table if not exists public.circles (
  id            bigserial     primary key,
  owner_user_id uuid          not null references auth.users(id) on delete cascade,
  kind          text          not null check (kind in ('public','friends','crew')),
  name          text,
  created_at    timestamptz   not null default now(),
  unique (owner_user_id, kind)
);
alter table public.circles enable row level security;
create policy "circles_owner_rw" on public.circles
  using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "circles_members_read" on public.circles
  for select using (
    id in (select circle_id from public.circle_members where user_id = auth.uid())
  );
create index if not exists idx_circles_owner_kind on public.circles (owner_user_id, kind);

-- ── 6. posts ─────────────────────────────────────────────────────────────────
-- Generic post rows keyed to a circle_id (V2 model, forward-compat).
-- The V1 model uses per-type tables (public_circle_posts, friends_circle_posts, etc.).
create table if not exists public.posts (
  id                   bigserial     primary key,
  author_user_id       uuid          not null references auth.users(id) on delete cascade,
  circle_id            bigint        not null references public.circles(id) on delete cascade,
  body                 text          not null,
  mood_tag             text,
  content_warning      text,
  is_identity_revealed boolean       not null default false,
  is_deleted           boolean       not null default false,
  created_at           timestamptz   not null default now()
);
alter table public.posts enable row level security;
-- Authors can always read/write their own posts.
create policy "posts_author_rw" on public.posts
  using (auth.uid() = author_user_id) with check (auth.uid() = author_user_id);
-- Circle members can read non-deleted posts.
create policy "posts_members_read" on public.posts
  for select using (
    is_deleted = false
    and circle_id in (select circle_id from public.circle_members where user_id = auth.uid())
  );
create index if not exists idx_posts_circle_created on public.posts (circle_id, created_at desc);

-- ── 7. post_reactions ────────────────────────────────────────────────────────
-- One reaction row per user per post (V2 generic model).
create table if not exists public.post_reactions (
  id         bigserial     primary key,
  post_id    bigint        not null references public.posts(id) on delete cascade,
  user_id    uuid          not null references auth.users(id) on delete cascade,
  reaction   text          not null,
  created_at timestamptz   not null default now(),
  unique (post_id, user_id, reaction)
);
alter table public.post_reactions enable row level security;
create policy "post_reactions_self" on public.post_reactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "post_reactions_read" on public.post_reactions
  for select using (auth.uid() is not null);
create index if not exists idx_post_reactions_post on public.post_reactions (post_id);

-- ── 8. post_comments ─────────────────────────────────────────────────────────
create table if not exists public.post_comments (
  id         bigserial     primary key,
  post_id    bigint        not null references public.posts(id) on delete cascade,
  user_id    uuid          not null references auth.users(id) on delete cascade,
  text       text          not null,
  created_at timestamptz   not null default now()
);
alter table public.post_comments enable row level security;
create policy "post_comments_self_write" on public.post_comments
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "post_comments_read" on public.post_comments
  for select using (auth.uid() is not null);
create index if not exists idx_post_comments_post on public.post_comments (post_id, created_at desc);

-- ── 9. moods ─────────────────────────────────────────────────────────────────
-- Reference table for mood taxonomy. Populated via seed data.
create table if not exists public.moods (
  id          serial        primary key,
  slug        text          not null unique,
  label       text          not null,
  emoji       text,
  category    text,
  sort_order  integer       not null default 0
);
alter table public.moods enable row level security;
-- Everyone authenticated can read moods (it's a reference table).
create policy "moods_read" on public.moods
  for select using (auth.uid() is not null);

-- ── 10. parent_mood_summaries ────────────────────────────────────────────────
-- Weekly mood digest shared with a linked parent. Privacy-first: only aggregate
-- counts are shared, never the raw journal text.
create table if not exists public.parent_mood_summaries (
  id              bigserial     primary key,
  teen_user_id    uuid          not null references auth.users(id) on delete cascade,
  parent_user_id  uuid          not null references auth.users(id) on delete cascade,
  week_start      date          not null,
  mood_counts     jsonb         not null default '{}'::jsonb,
  created_at      timestamptz   not null default now(),
  unique (teen_user_id, parent_user_id, week_start)
);
alter table public.parent_mood_summaries enable row level security;
-- Teen can write; parent can read their linked teen's summaries.
create policy "pms_teen_write" on public.parent_mood_summaries
  for insert with check (auth.uid() = teen_user_id);
create policy "pms_teen_update" on public.parent_mood_summaries
  for update using (auth.uid() = teen_user_id);
create policy "pms_read" on public.parent_mood_summaries
  for select using (auth.uid() = teen_user_id or auth.uid() = parent_user_id);
create index if not exists idx_pms_teen_week on public.parent_mood_summaries (teen_user_id, week_start desc);

-- ── 11. safety_alerts ────────────────────────────────────────────────────────
-- High-priority safety escalations. Written by the teen side when crisis
-- keywords are detected; readable by linked parents.
-- severity: 'low' | 'medium' | 'high'
-- status:   'active' | 'acknowledged' | 'resolved'
create table if not exists public.safety_alerts (
  id              bigserial     primary key,
  teen_user_id    uuid          not null references auth.users(id) on delete cascade,
  severity        text          not null default 'medium' check (severity in ('low','medium','high')),
  context_snippet text,
  status          text          not null default 'active' check (status in ('active','acknowledged','resolved')),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);
alter table public.safety_alerts enable row level security;
create policy "safety_alerts_teen_write" on public.safety_alerts
  for insert with check (auth.uid() = teen_user_id);
create policy "safety_alerts_teen_read" on public.safety_alerts
  for select using (auth.uid() = teen_user_id);
-- Parents linked to this teen can also read alerts.
create policy "safety_alerts_parent_read" on public.safety_alerts
  for select using (
    teen_user_id in (
      select teen_user_id from public.parent_links
      where parent_user_id = auth.uid() and status = 'accepted'
    )
  );
create index if not exists idx_safety_alerts_teen on public.safety_alerts (teen_user_id, created_at desc);
