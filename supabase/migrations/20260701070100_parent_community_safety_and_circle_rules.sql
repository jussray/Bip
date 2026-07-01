-- 20260701070100_parent_community_safety_and_circle_rules.sql
-- Se'kret Bip — Circle V2 parent community + post safety groundwork
--
-- Depends on 20260701070000_add_parent_community_circle_kind.sql.
-- No legacy Circle tables are dropped or rewritten here.

begin;

-- ── 1. Account verification can represent guardians independently of a teen link ──
-- Existing states are preserved. These states allow Parent Community access to be
-- modeled as "verified guardian account", not "linked to this specific teen".
alter table public.account_verification
  drop constraint if exists account_verification_verification_state_check;

alter table public.account_verification
  add constraint account_verification_verification_state_check
  check (verification_state in (
    'UNVERIFIED',
    'PENDING_PARENT',
    'PENDING_TRUSTED_ADULT',
    'LIMITED_MODE',
    'VERIFIED_TEEN',
    'EXPIRED',
    'MANUAL_REVIEW',
    'SUSPENDED',
    'PENDING_GUARDIAN_REVIEW',
    'VERIFIED_GUARDIAN',
    'GUARDIAN_REJECTED',
    'GUARDIAN_SUSPENDED'
  ));

-- ── 2. Parent Community is a community feed, not a parent_links Bridge space ──
-- Existing kind='parent' stays unchanged: it remains tied to parent_link_id.
-- New kind='parent_community' is guardian-owned and independent of parent_links.
alter table public.circles
  drop constraint if exists circles_kind_shape;

alter table public.circles
  add constraint circles_kind_shape
  check (
    (
      kind = 'crew'::public.circle_kind
      and crew_id is not null
      and parent_link_id is null
    )
    or (
      kind = 'parent'::public.circle_kind
      and parent_link_id is not null
      and crew_id is null
    )
    or (
      kind in ('public'::public.circle_kind, 'friends'::public.circle_kind, 'parent_community'::public.circle_kind)
      and crew_id is null
      and parent_link_id is null
    )
  );

comment on type public.circle_kind is
  'Circle destination kinds. parent is reserved for parent_links/private Bridge spaces; parent_community is the guardian-only community feed.';

-- ── 3. Helper functions for guardian and teen account gates ───────────────────
create or replace function public.is_verified_guardian(p_user_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.circle_profiles cp
    left join public.account_verification av on av.user_id = cp.user_id
    where cp.user_id = p_user_id
      and cp.account_type = 'guardian'
      and coalesce(av.verification_state, 'UNVERIFIED') = 'VERIFIED_GUARDIAN'
  );
$$;

create or replace function public.is_verified_teen(p_user_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.circle_profiles cp
    left join public.account_verification av on av.user_id = cp.user_id
    where cp.user_id = p_user_id
      and cp.account_type = 'teen'
      and coalesce(av.verification_state, 'UNVERIFIED') in ('VERIFIED_TEEN', 'LIMITED_MODE')
  );
$$;

revoke all on function public.is_verified_guardian(uuid) from public, anon;
revoke all on function public.is_verified_teen(uuid) from public, anon;
grant execute on function public.is_verified_guardian(uuid) to authenticated;
grant execute on function public.is_verified_teen(uuid) to authenticated;

-- ── 4. V2 Circle visibility ──────────────────────────────────────────────────
-- Teen public Circle remains an open community feed for verified teens.
-- Parent Community is an open community feed for verified guardians.
-- Friends and Crew stay gated by their existing relationships/membership rules.
drop policy if exists "circles select owner or member" on public.circles;
create policy "circles select owner member or open community"
on public.circles
for select
to authenticated
using (
  owner_user_id = (select auth.uid() as uid)
  or id in (
    select cm.circle_id
    from public.circle_members cm
    where cm.user_id = (select auth.uid() as uid)
  )
  or (
    kind = 'public'::public.circle_kind
    and public.is_verified_teen((select auth.uid() as uid))
  )
  or (
    kind = 'parent_community'::public.circle_kind
    and public.is_verified_guardian((select auth.uid() as uid))
  )
);

-- ── 5. Post access helper mirrors the same product rules ─────────────────────
create or replace function public.assert_can_access_post(p_post_id uuid, p_user_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.posts p
    join public.circles c on c.id = p.circle_id
    where p.id = p_post_id
      and p.is_deleted = false
      and (
        p.author_user_id = p_user_id
        or (
          c.kind = 'public'
          and public.is_verified_teen(p_user_id)
        )
        or (
          c.kind = 'parent_community'
          and public.is_verified_guardian(p_user_id)
        )
        or (
          c.kind = 'friends'
          and c.owner_user_id in (
            select f1.friend_user_id
            from public.friendships f1
            join public.friendships f2
              on f1.user_id = f2.friend_user_id
             and f1.friend_user_id = f2.user_id
            where f1.user_id = p_user_id
          )
        )
        or (
          c.kind = 'crew'
          and exists (
            select 1
            from public.circle_members cm
            where cm.circle_id = c.id
              and cm.user_id = p_user_id
          )
        )
      )
  );
$$;

revoke all on function public.assert_can_access_post(uuid, uuid) from public, anon;
grant execute on function public.assert_can_access_post(uuid, uuid) to authenticated;

-- Recreate post SELECT policy with the same rules through the helper.
drop policy if exists "posts select by circle visibility" on public.posts;
create policy "posts select by circle visibility"
on public.posts
for select
to authenticated
using (public.assert_can_access_post(id, (select auth.uid() as uid)));

-- ── 6. Post write rules and identity protection ──────────────────────────────
create or replace function public.enforce_circle_post_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_kind public.circle_kind;
  v_owner uuid;
  v_is_member boolean;
begin
  select kind, owner_user_id
    into v_kind, v_owner
    from public.circles
   where id = new.circle_id;

  if not found then
    raise exception 'Circle not found';
  end if;

  -- Existing parent Bridge circles remain non-post destinations.
  if v_kind = 'parent' then
    raise exception 'Parent bridge is not a community post destination';
  end if;

  if v_kind = 'public' then
    if new.author_user_id <> v_owner then
      raise exception 'Users can only post to their own public circle';
    end if;
    if not public.is_verified_teen(new.author_user_id) then
      raise exception 'Only verified teens can post to Teen Circle';
    end if;
    new.is_identity_revealed := false;
    return new;
  end if;

  if v_kind = 'friends' then
    if new.author_user_id <> v_owner then
      raise exception 'Users can only post to their own friends circle';
    end if;
    if not public.is_verified_teen(new.author_user_id) then
      raise exception 'Only verified teens can post to Friends Circle';
    end if;
    return new;
  end if;

  if v_kind = 'parent_community' then
    if new.author_user_id <> v_owner then
      raise exception 'Guardians can only post to their own parent community circle';
    end if;
    if not public.is_verified_guardian(new.author_user_id) then
      raise exception 'Only verified guardians can post to Parent Community';
    end if;
    new.is_identity_revealed := false;
    return new;
  end if;

  if v_kind = 'crew' then
    select exists (
      select 1
      from public.circle_members cm
      where cm.circle_id = new.circle_id
        and cm.user_id = new.author_user_id
    ) into v_is_member;

    if not v_is_member then
      raise exception 'Only crew members can post to this crew circle';
    end if;
    if not public.is_verified_teen(new.author_user_id) then
      raise exception 'Only verified teens can post to Crew Circle';
    end if;
    return new;
  end if;

  return new;
end;
$$;

-- ── 7. Safety scan support for V2 posts.author_user_id ───────────────────────
alter table public.posts
  add column if not exists safety_flagged boolean not null default false;

create or replace function public.trigger_safety_scan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _col_name text := TG_ARGV[0];
  _content  text;
  _secret   text;
  _user_id  text;
begin
  _content := case _col_name
    when 'text' then to_jsonb(new)->>'text'
    when 'body' then to_jsonb(new)->>'body'
    else null
  end;

  _user_id := coalesce(to_jsonb(new)->>'user_id', to_jsonb(new)->>'author_user_id');

  if _content is null or length(trim(_content)) = 0 or _user_id is null then
    return new;
  end if;

  select decrypted_secret
    into _secret
    from vault.decrypted_secrets
   where name = 'safety_scan_secret'
   limit 1;

  if _secret is null or _secret = '' then
    return new;
  end if;

  perform net.http_post(
    url     := 'https://tbsevonvegdnlyjgplmm.supabase.co/functions/v1/safety-scan',
    body    := jsonb_build_object(
                 'record_id',    new.id::text,
                 'user_id',      _user_id,
                 'source_table', TG_TABLE_NAME::text,
                 'content',      _content
               ),
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'x-scan-secret', _secret
               )
  );

  return new;
end;
$$;

revoke execute on function public.trigger_safety_scan() from public, anon, authenticated;

-- Keep existing legacy triggers and add V2 posts coverage.
drop trigger if exists safety_scan_posts on public.posts;
create trigger safety_scan_posts
  after insert on public.posts
  for each row execute function public.trigger_safety_scan('body');

commit;
