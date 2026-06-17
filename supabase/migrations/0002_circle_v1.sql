-- Se'kret Bip — Circle V1 Migration
-- Run in Supabase SQL editor after 0001_init.sql
-- All tables are RLS-scoped. Parent data is fully isolated from teen circle data.

-- ── circle_profiles ─────────────────────────────────────────────────────────
-- One row per user. Stores chosen nickname, avatar, and account type.
-- account_type: 'teen' | 'parent'
-- Teen account_type is NEVER exposed to parent queries and vice versa.
create table if not exists public.circle_profiles (
  user_id       uuid          primary key references auth.users(id) on delete cascade,
  nickname      text          not null default 'Anonymous',
  avatar_emoji  text          not null default '🌙',
  account_type  text          not null default 'teen' check (account_type in ('teen','parent')),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);
alter table public.circle_profiles enable row level security;
create policy "circle_profiles_self_rw" on public.circle_profiles
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- NOTE: circle_profiles_friends_read is defined AFTER circle_friendships is created below.

-- ── circle_friend_requests ───────────────────────────────────────────────────
-- "Add To My Circle" requests between teen accounts only.
create table if not exists public.circle_friend_requests (
  id          bigserial     primary key,
  from_user   uuid          not null references auth.users(id) on delete cascade,
  to_user     uuid          not null references auth.users(id) on delete cascade,
  status      text          not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at  timestamptz   not null default now(),
  unique (from_user, to_user)
);
alter table public.circle_friend_requests enable row level security;
create policy "cfr_self" on public.circle_friend_requests
  using (auth.uid() = from_user or auth.uid() = to_user)
  with check (auth.uid() = from_user);

-- ── circle_friendships ───────────────────────────────────────────────────────
-- Accepted friendships. Populated when a circle_friend_request is accepted.
create table if not exists public.circle_friendships (
  id          bigserial     primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  friend_id   uuid          not null references auth.users(id) on delete cascade,
  status      text          not null default 'accepted',
  created_at  timestamptz   not null default now(),
  unique (user_id, friend_id)
);
alter table public.circle_friendships enable row level security;
create policy "cf_self" on public.circle_friendships
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Allow reading nickname/avatar of accepted friends (not account_type, not user_id mapping)
-- Defined here so circle_friendships exists when the policy is parsed.
create policy "circle_profiles_friends_read" on public.circle_profiles
  for select using (
    user_id in (
      select friend_id from public.circle_friendships where user_id = auth.uid() and status = 'accepted'
      union
      select user_id  from public.circle_friendships where friend_id = auth.uid() and status = 'accepted'
    )
  );

-- ── crew_memberships ─────────────────────────────────────────────────────────
-- Trusted Crew connections. Identity is always visible within this circle.
create table if not exists public.crew_memberships (
  id          bigserial     primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  member_id   uuid          not null references auth.users(id) on delete cascade,
  created_at  timestamptz   not null default now(),
  unique (user_id, member_id)
);
alter table public.crew_memberships enable row level security;
create policy "cm_self" on public.crew_memberships
  using (auth.uid() = user_id or auth.uid() = member_id);

-- ── public_circle_posts ──────────────────────────────────────────────────────
-- Anonymous only. user_id is stored for moderation but NEVER returned to clients.
-- No comments allowed. Reactions only.
create table if not exists public.public_circle_posts (
  id          bigserial     primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  text        text          not null,
  post_mood   text,
  media_kind  text,
  reactions   jsonb         not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  created_at  timestamptz   not null default now()
);
alter table public.public_circle_posts enable row level security;
-- Anyone authenticated can read public posts (user_id must be stripped in app layer)
create policy "pcp_read" on public.public_circle_posts
  for select using (auth.uid() is not null);
-- Only owner can insert
create policy "pcp_insert" on public.public_circle_posts
  for insert with check (auth.uid() = user_id);
-- Only owner can delete own post
create policy "pcp_delete" on public.public_circle_posts
  for delete using (auth.uid() = user_id);
create index if not exists idx_public_circle_posts_created
  on public.public_circle_posts (created_at desc);

-- ── friends_circle_posts ─────────────────────────────────────────────────────
-- Visible to accepted friends only. Shows nickname/avatar. No real name.
create table if not exists public.friends_circle_posts (
  id          bigserial     primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  text        text          not null,
  post_mood   text,
  media_kind  text,
  reactions   jsonb         not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  created_at  timestamptz   not null default now()
);
alter table public.friends_circle_posts enable row level security;
create policy "fcp_self_write" on public.friends_circle_posts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fcp_friends_read" on public.friends_circle_posts
  for select using (
    auth.uid() = user_id
    or user_id in (
      select friend_id from public.circle_friendships where user_id = auth.uid() and status = 'accepted'
      union
      select user_id  from public.circle_friendships where friend_id = auth.uid() and status = 'accepted'
    )
  );
create index if not exists idx_friends_circle_posts_created
  on public.friends_circle_posts (created_at desc);

-- ── crew_circle_posts ────────────────────────────────────────────────────────
-- Visible to accepted Crew members only. Identity fully visible.
create table if not exists public.crew_circle_posts (
  id          bigserial     primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  text        text          not null,
  post_mood   text,
  media_kind  text,
  reactions   jsonb         not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  created_at  timestamptz   not null default now()
);
alter table public.crew_circle_posts enable row level security;
create policy "ccp_self_write" on public.crew_circle_posts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ccp_crew_read" on public.crew_circle_posts
  for select using (
    auth.uid() = user_id
    or user_id in (
      select member_id from public.crew_memberships where user_id = auth.uid()
      union
      select user_id   from public.crew_memberships where member_id = auth.uid()
    )
  );
create index if not exists idx_crew_circle_posts_created
  on public.crew_circle_posts (created_at desc);

-- ── circle_comments ──────────────────────────────────────────────────────────
-- Allowed on: friends_circle_posts, crew_circle_posts, parent_circle_posts.
-- NEVER on public_circle_posts (enforced in app layer + no RLS grant for public posts).
-- post_type: 'friends' | 'crew' | 'parent'
create table if not exists public.circle_comments (
  id          bigserial     primary key,
  post_id     bigint        not null,
  post_type   text          not null check (post_type in ('friends','crew','parent')),
  user_id     uuid          not null references auth.users(id) on delete cascade,
  text        text          not null,
  created_at  timestamptz   not null default now()
);
alter table public.circle_comments enable row level security;
create policy "cc_self_write" on public.circle_comments
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Readers: friends/crew/parent comments visible to users who can see the parent post
-- (app layer must validate post_type before displaying; DB enforces write ownership)
create policy "cc_read" on public.circle_comments
  for select using (auth.uid() is not null);
create index if not exists idx_circle_comments_post
  on public.circle_comments (post_id, post_type, created_at desc);

-- ── circle_reactions ─────────────────────────────────────────────────────────
-- One reaction per user per post. post_type: 'public' | 'friends' | 'crew' | 'parent'
create table if not exists public.circle_reactions (
  id          bigserial     primary key,
  post_id     bigint        not null,
  post_type   text          not null check (post_type in ('public','friends','crew','parent')),
  user_id     uuid          not null references auth.users(id) on delete cascade,
  emoji       text          not null,
  created_at  timestamptz   not null default now(),
  unique (post_id, post_type, user_id)
);
alter table public.circle_reactions enable row level security;
create policy "cr_self" on public.circle_reactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cr_read" on public.circle_reactions
  for select using (auth.uid() is not null);

-- ── blocked_users ────────────────────────────────────────────────────────────
create table if not exists public.blocked_users (
  id           bigserial     primary key,
  user_id      uuid          not null references auth.users(id) on delete cascade,
  blocked_id   uuid          not null references auth.users(id) on delete cascade,
  created_at   timestamptz   not null default now(),
  unique (user_id, blocked_id)
);
alter table public.blocked_users enable row level security;
create policy "bu_self" on public.blocked_users
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── reported_posts ───────────────────────────────────────────────────────────
-- post_type: 'public' | 'friends' | 'crew' | 'parent'
create table if not exists public.reported_posts (
  id          bigserial     primary key,
  reporter_id uuid          not null references auth.users(id) on delete cascade,
  post_id     bigint        not null,
  post_type   text          not null check (post_type in ('public','friends','crew','parent')),
  reason      text,
  created_at  timestamptz   not null default now(),
  unique (reporter_id, post_id, post_type)
);
alter table public.reported_posts enable row level security;
create policy "rp_self" on public.reported_posts
  using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);
