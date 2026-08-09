-- Se'kret Bip — Circle V1 Migration + verified pre-ledger Circle V2 foundation
--
-- Production records version 0002 as applied, while retained bootstrap history
-- and the live schema prove the UUID/enum Circle V2 foundation already existed
-- before later timestamped migrations started altering circle_kind, circles,
-- posts, reactions, moods, and parent summaries. Fresh replay therefore carries
-- that verified pre-ledger union here rather than inventing a new historical
-- version production never recorded.

-- ── V1 per-feed Circle tables ────────────────────────────────────────────────
create table if not exists public.circle_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'Anonymous',
  avatar_emoji text not null default '🌙',
  account_type text not null default 'teen' check (account_type in ('teen','parent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.circle_profiles enable row level security;
create policy "circle_profiles_self_rw" on public.circle_profiles
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.circle_friend_requests (
  id bigserial primary key,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (from_user, to_user)
);
alter table public.circle_friend_requests enable row level security;
create policy "cfr_self" on public.circle_friend_requests
  using (auth.uid() = from_user or auth.uid() = to_user)
  with check (auth.uid() = from_user);

create table if not exists public.circle_friendships (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);
alter table public.circle_friendships enable row level security;
create policy "cf_self" on public.circle_friendships
  using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "circle_profiles_friends_read" on public.circle_profiles
  for select using (
    user_id in (
      select friend_id from public.circle_friendships where user_id = auth.uid() and status = 'accepted'
      union
      select user_id from public.circle_friendships where friend_id = auth.uid() and status = 'accepted'
    )
  );

create table if not exists public.crew_memberships (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, member_id)
);
alter table public.crew_memberships enable row level security;
create policy "cm_self" on public.crew_memberships
  using (auth.uid() = user_id or auth.uid() = member_id);

create table if not exists public.public_circle_posts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  post_mood text,
  media_kind text,
  reactions jsonb not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.public_circle_posts enable row level security;
create policy "pcp_read" on public.public_circle_posts for select using (auth.uid() is not null);
create policy "pcp_insert" on public.public_circle_posts for insert with check (auth.uid() = user_id);
create policy "pcp_delete" on public.public_circle_posts for delete using (auth.uid() = user_id);
create index if not exists idx_public_circle_posts_created on public.public_circle_posts (created_at desc);

create table if not exists public.friends_circle_posts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  post_mood text,
  media_kind text,
  reactions jsonb not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  created_at timestamptz not null default now()
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
      select user_id from public.circle_friendships where friend_id = auth.uid() and status = 'accepted'
    )
  );
create index if not exists idx_friends_circle_posts_created on public.friends_circle_posts (created_at desc);

create table if not exists public.crew_circle_posts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  post_mood text,
  media_kind text,
  reactions jsonb not null default '{"felt":0,"comfort":0,"proud":0,"stay":0}'::jsonb,
  created_at timestamptz not null default now()
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
      select user_id from public.crew_memberships where member_id = auth.uid()
    )
  );
create index if not exists idx_crew_circle_posts_created on public.crew_circle_posts (created_at desc);

create table if not exists public.circle_comments (
  id bigserial primary key,
  post_id bigint not null,
  post_type text not null check (post_type in ('friends','crew','parent')),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.circle_comments enable row level security;
create policy "cc_self_write" on public.circle_comments
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cc_read" on public.circle_comments for select using (auth.uid() is not null);
create index if not exists idx_circle_comments_post on public.circle_comments (post_id, post_type, created_at desc);

create table if not exists public.circle_reactions (
  id bigserial primary key,
  post_id bigint not null,
  post_type text not null check (post_type in ('public','friends','crew','parent')),
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, post_type, user_id)
);
alter table public.circle_reactions enable row level security;
create policy "cr_self" on public.circle_reactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cr_read" on public.circle_reactions for select using (auth.uid() is not null);

create table if not exists public.blocked_users (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, blocked_id)
);
alter table public.blocked_users enable row level security;
create policy "bu_self" on public.blocked_users using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.reported_posts (
  id bigserial primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id bigint not null,
  post_type text not null check (post_type in ('public','friends','crew','parent')),
  reason text,
  created_at timestamptz not null default now(),
  unique (reporter_id, post_id, post_type)
);
alter table public.reported_posts enable row level security;
create policy "rp_self" on public.reported_posts using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);

-- ── Verified pre-ledger Circle V2 foundation ─────────────────────────────────
-- Source authority: retained full bootstrap + read-only live schema catalog.
-- Keep safety_alerts out of this section: canonical 0003 owns that table.

create type public.circle_kind as enum ('public','friends','crew','parent');
create type public.reaction_kind as enum ('hug','heart','listen','support','spark');
create type public.mood_level as enum ('very_low','low','okay','good','great');

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  description text,
  max_members integer default 15 check (max_members is null or max_members between 2 and 15),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- parent_links is a verified pre-ledger dependency of circles. The union shape
-- matches live production and is repeated as CREATE IF NOT EXISTS in 0003.
create table if not exists public.parent_links (
  id uuid primary key default gen_random_uuid(),
  teen_user_id uuid not null references auth.users(id) on delete cascade,
  parent_user_id uuid references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  invite_code text unique,
  status text not null default 'pending',
  linked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_links_distinct_users check (parent_user_id is null or teen_user_id <> parent_user_id),
  constraint parent_links_one_parent_per_teen unique (teen_user_id)
);

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  kind public.circle_kind not null,
  crew_id uuid references public.crews(id) on delete cascade,
  parent_link_id uuid references public.parent_links(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint circles_kind_shape check (
    (kind = 'crew' and crew_id is not null and parent_link_id is null)
    or (kind = 'parent' and parent_link_id is not null and crew_id is null)
    or (kind in ('public','friends') and crew_id is null and parent_link_id is null)
  )
);

create unique index if not exists circles_owner_public_uniq on public.circles(owner_user_id, kind) where kind = 'public';
create unique index if not exists circles_owner_friends_uniq on public.circles(owner_user_id, kind) where kind = 'friends';
create unique index if not exists circles_owner_crew_uniq on public.circles(owner_user_id, crew_id) where kind = 'crew';
create unique index if not exists circles_owner_parent_uniq on public.circles(owner_user_id, parent_link_id) where kind = 'parent';

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  unique (circle_id, user_id)
);

create table if not exists public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_user_id),
  constraint friendships_no_self check (user_id <> friend_user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  mood_tag text,
  content_warning text,
  is_identity_revealed boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction public.reaction_kind not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood public.mood_level not null,
  energy_level smallint check (energy_level between 1 and 5),
  anxiety_level smallint check (anxiety_level between 1 and 5),
  journal_excerpt text,
  is_private boolean not null default true,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_mood_summaries (
  id uuid primary key default gen_random_uuid(),
  teen_user_id uuid not null references auth.users(id) on delete cascade,
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  mood_entry_count integer not null default 0 check (mood_entry_count >= 0),
  dominant_mood public.mood_level,
  average_energy numeric(4,2),
  average_anxiety numeric(4,2),
  low_mood_count integer not null default 0 check (low_mood_count >= 0),
  very_low_mood_count integer not null default 0 check (very_low_mood_count >= 0),
  support_flag boolean not null default false,
  summary_text text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_mood_summaries_date_range check (period_end >= period_start),
  unique (teen_user_id, parent_user_id, period_start, period_end)
);

create index if not exists posts_circle_created_idx on public.posts(circle_id, created_at desc);
create index if not exists posts_author_created_idx on public.posts(author_user_id, created_at desc);
create index if not exists circle_members_user_idx on public.circle_members(user_id, circle_id);
create index if not exists friendships_friend_idx on public.friendships(friend_user_id, user_id);
create index if not exists crews_owner_idx on public.crews(owner_user_id);
create index if not exists parent_links_parent_idx on public.parent_links(parent_user_id);
create index if not exists post_comments_post_created_idx on public.post_comments(post_id, created_at asc);
create index if not exists post_comments_author_idx on public.post_comments(author_user_id, created_at desc);
create index if not exists post_reactions_post_idx on public.post_reactions(post_id, created_at desc);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id, created_at desc);
create index if not exists moods_user_recorded_idx on public.moods(user_id, recorded_at desc);
create index if not exists parent_mood_summaries_parent_idx on public.parent_mood_summaries(parent_user_id, period_end desc);
create index if not exists parent_mood_summaries_teen_idx on public.parent_mood_summaries(teen_user_id, period_end desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_circle_post_rules()
returns trigger
language plpgsql
as $$
declare
  v_kind public.circle_kind;
  v_owner uuid;
  v_crew_id uuid;
  v_parent_link_id uuid;
  v_is_member boolean;
begin
  select kind, owner_user_id, crew_id, parent_link_id
  into v_kind, v_owner, v_crew_id, v_parent_link_id
  from public.circles
  where id = new.circle_id;
  if not found then raise exception 'Circle not found'; end if;
  if v_kind = 'parent' then raise exception 'Parent bridge is not a post destination'; end if;
  if v_kind = 'public' then
    if new.author_user_id <> v_owner then raise exception 'Users can only post to their own public circle'; end if;
    return new;
  end if;
  if v_kind = 'friends' then
    if new.author_user_id <> v_owner then raise exception 'Users can only post to their own friends circle'; end if;
    return new;
  end if;
  if v_kind = 'crew' then
    select exists (
      select 1 from public.circle_members cm
      where cm.circle_id = new.circle_id and cm.user_id = new.author_user_id
    ) into v_is_member;
    if not v_is_member then raise exception 'Only crew members can post to this crew circle'; end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_crew_member_limit()
returns trigger
language plpgsql
as $$
declare
  v_crew_id uuid;
  v_max_members integer;
  v_count integer;
begin
  select c.crew_id into v_crew_id from public.circles c where c.id = new.circle_id and c.kind = 'crew';
  if v_crew_id is null then return new; end if;
  select max_members into v_max_members from public.crews where id = v_crew_id;
  select count(*) into v_count from public.circle_members where circle_id = new.circle_id;
  if v_max_members is not null and v_count >= v_max_members then raise exception 'Crew member limit reached'; end if;
  return new;
end;
$$;

create or replace function public.assert_can_access_post(p_post_id uuid, p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and (
        p.author_user_id = p_user_id
        or p.circle_id in (select c.id from public.circles c where c.kind = 'public')
        or p.circle_id in (
          select c.id from public.circles c
          where c.kind = 'friends'
            and c.owner_user_id in (
              select f1.friend_user_id
              from public.friendships f1
              join public.friendships f2
                on f1.user_id = f2.friend_user_id and f1.friend_user_id = f2.user_id
              where f1.user_id = p_user_id
            )
        )
        or p.circle_id in (select cm.circle_id from public.circle_members cm where cm.user_id = p_user_id)
      )
  );
$$;

create or replace function public.assert_can_parent_view_teen(p_teen_user_id uuid, p_parent_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.parent_links pl
    where pl.teen_user_id = p_teen_user_id
      and pl.parent_user_id = p_parent_user_id
      and pl.is_active = true
  );
$$;

create or replace function public.enforce_comment_visibility()
returns trigger language plpgsql as $$
begin
  if not public.assert_can_access_post(new.post_id, new.author_user_id) then
    raise exception 'User cannot comment on this post';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_reaction_visibility()
returns trigger language plpgsql as $$
begin
  if not public.assert_can_access_post(new.post_id, new.user_id) then
    raise exception 'User cannot react to this post';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_parent_summary_link()
returns trigger language plpgsql as $$
begin
  if not public.assert_can_parent_view_teen(new.teen_user_id, new.parent_user_id) then
    raise exception 'Parent summary must map to an active parent link';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_crews_updated_at on public.crews;
create trigger trg_crews_updated_at before update on public.crews for each row execute function public.set_updated_at();
drop trigger if exists trg_parent_links_updated_at on public.parent_links;
create trigger trg_parent_links_updated_at before update on public.parent_links for each row execute function public.set_updated_at();
drop trigger if exists trg_circles_updated_at on public.circles;
create trigger trg_circles_updated_at before update on public.circles for each row execute function public.set_updated_at();
drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
drop trigger if exists trg_posts_circle_rules on public.posts;
create trigger trg_posts_circle_rules before insert or update on public.posts for each row execute function public.enforce_circle_post_rules();
drop trigger if exists trg_circle_members_limit on public.circle_members;
create trigger trg_circle_members_limit before insert on public.circle_members for each row execute function public.enforce_crew_member_limit();
drop trigger if exists trg_post_comments_updated_at on public.post_comments;
create trigger trg_post_comments_updated_at before update on public.post_comments for each row execute function public.set_updated_at();
drop trigger if exists trg_moods_updated_at on public.moods;
create trigger trg_moods_updated_at before update on public.moods for each row execute function public.set_updated_at();
drop trigger if exists trg_parent_mood_summaries_updated_at on public.parent_mood_summaries;
create trigger trg_parent_mood_summaries_updated_at before update on public.parent_mood_summaries for each row execute function public.set_updated_at();
drop trigger if exists trg_post_comments_visibility on public.post_comments;
create trigger trg_post_comments_visibility before insert or update on public.post_comments for each row execute function public.enforce_comment_visibility();
drop trigger if exists trg_post_reactions_visibility on public.post_reactions;
create trigger trg_post_reactions_visibility before insert or update on public.post_reactions for each row execute function public.enforce_reaction_visibility();
drop trigger if exists trg_parent_mood_summaries_link on public.parent_mood_summaries;
create trigger trg_parent_mood_summaries_link before insert or update on public.parent_mood_summaries for each row execute function public.enforce_parent_summary_link();

alter table public.crews enable row level security;
alter table public.parent_links enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.friendships enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.moods enable row level security;
alter table public.parent_mood_summaries enable row level security;

create policy "crews select own or member" on public.crews for select to authenticated using (
  owner_user_id = (select auth.uid())
  or id in (
    select c.crew_id from public.circles c
    join public.circle_members cm on cm.circle_id = c.id
    where c.kind = 'crew' and c.crew_id is not null and cm.user_id = (select auth.uid())
  )
);
create policy "crews insert own" on public.crews for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "crews update own" on public.crews for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

create policy "parent links select linked users" on public.parent_links for select to authenticated using (
  teen_user_id = (select auth.uid()) or parent_user_id = (select auth.uid())
);
create policy "parent links insert teen only" on public.parent_links for insert to authenticated with check (teen_user_id = (select auth.uid()));
create policy "parent links update linked teen" on public.parent_links for update to authenticated using (teen_user_id = (select auth.uid())) with check (teen_user_id = (select auth.uid()));

create policy "circles select owner or member" on public.circles for select to authenticated using (
  owner_user_id = (select auth.uid())
  or id in (select cm.circle_id from public.circle_members cm where cm.user_id = (select auth.uid()))
  or kind = 'public'
);
create policy "circles insert own" on public.circles for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "circles update own" on public.circles for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

create policy "circle members select own circles" on public.circle_members for select to authenticated using (
  user_id = (select auth.uid())
  or circle_id in (select id from public.circles where owner_user_id = (select auth.uid()))
);
create policy "circle members insert owner only" on public.circle_members for insert to authenticated with check (
  circle_id in (select id from public.circles where owner_user_id = (select auth.uid()))
);
create policy "circle members delete owner only" on public.circle_members for delete to authenticated using (
  circle_id in (select id from public.circles where owner_user_id = (select auth.uid()))
);

create policy "friendships select own" on public.friendships for select to authenticated using (
  user_id = (select auth.uid()) or friend_user_id = (select auth.uid())
);
create policy "friendships insert own side" on public.friendships for insert to authenticated with check (user_id = (select auth.uid()));
create policy "friendships delete own side" on public.friendships for delete to authenticated using (user_id = (select auth.uid()));

create policy "posts select by circle visibility" on public.posts for select to authenticated using (
  author_user_id = (select auth.uid())
  or circle_id in (select c.id from public.circles c where c.kind = 'public')
  or circle_id in (
    select c.id from public.circles c
    where c.kind = 'friends'
      and c.owner_user_id in (
        select f1.friend_user_id
        from public.friendships f1
        join public.friendships f2 on f1.user_id = f2.friend_user_id and f1.friend_user_id = f2.user_id
        where f1.user_id = (select auth.uid())
      )
  )
  or circle_id in (select cm.circle_id from public.circle_members cm where cm.user_id = (select auth.uid()))
);
create policy "posts insert by author" on public.posts for insert to authenticated with check (author_user_id = (select auth.uid()));
create policy "posts update own" on public.posts for update to authenticated using (author_user_id = (select auth.uid())) with check (author_user_id = (select auth.uid()));
create policy "posts delete own" on public.posts for delete to authenticated using (author_user_id = (select auth.uid()));

create policy "comments select if post visible" on public.post_comments for select to authenticated using (public.assert_can_access_post(post_id, (select auth.uid())));
create policy "comments insert own if post visible" on public.post_comments for insert to authenticated with check (
  author_user_id = (select auth.uid()) and public.assert_can_access_post(post_id, (select auth.uid()))
);
create policy "comments update own" on public.post_comments for update to authenticated using (author_user_id = (select auth.uid())) with check (author_user_id = (select auth.uid()));
create policy "comments delete own" on public.post_comments for delete to authenticated using (author_user_id = (select auth.uid()));

create policy "reactions select if post visible" on public.post_reactions for select to authenticated using (public.assert_can_access_post(post_id, (select auth.uid())));
create policy "reactions insert own if post visible" on public.post_reactions for insert to authenticated with check (
  user_id = (select auth.uid()) and public.assert_can_access_post(post_id, (select auth.uid()))
);
create policy "reactions delete own" on public.post_reactions for delete to authenticated using (user_id = (select auth.uid()));

create policy "moods select own" on public.moods for select to authenticated using (user_id = (select auth.uid()));
create policy "moods insert own" on public.moods for insert to authenticated with check (user_id = (select auth.uid()));
create policy "moods update own" on public.moods for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "moods delete own" on public.moods for delete to authenticated using (user_id = (select auth.uid()));

create policy "parent summaries select linked teen or parent" on public.parent_mood_summaries for select to authenticated using (
  teen_user_id = (select auth.uid()) or parent_user_id = (select auth.uid())
);
create policy "parent summaries insert teen only" on public.parent_mood_summaries for insert to authenticated with check (teen_user_id = (select auth.uid()));
create policy "parent summaries update teen only" on public.parent_mood_summaries for update to authenticated using (teen_user_id = (select auth.uid())) with check (teen_user_id = (select auth.uid()));
