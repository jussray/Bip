-- Unlimited Bip Crew + accepted-connection identity privacy.
--
-- Accounts remain anonymous to other users until an accepted Crew relationship
-- exists. Crew size is not capped, but every relationship and share is held to
-- permanent-account, acceptance, block, removal, self-link, and RLS standards.

begin;

-- ── Remove legacy Crew-size ceilings ─────────────────────────────────────────

drop trigger if exists trg_circle_members_limit on public.circle_members;
drop function if exists public.enforce_crew_member_limit();

alter table public.crews
  drop constraint if exists crews_max_members_check;
alter table public.crews
  alter column max_members drop not null;
alter table public.crews
  alter column max_members drop default;
update public.crews set max_members = null where max_members is not null;

comment on column public.crews.max_members is
  'Legacy compatibility column. NULL means Bip Crew membership is unlimited; connection standards are enforced instead of a numeric cap.';

-- ── One durable relationship row per owner/member pair ───────────────────────

drop index if exists public.crew_members_one_member_per_owner;
create unique index if not exists crew_members_one_relationship_per_owner
  on public.crew_members (user_id, member_user_id)
  where member_user_id is not null;

create index if not exists crew_members_member_status_idx
  on public.crew_members (member_user_id, connection_status, user_id)
  where member_user_id is not null;

alter table public.crew_members
  drop constraint if exists crew_members_no_self_link;
alter table public.crew_members
  add constraint crew_members_no_self_link
  check (member_user_id is null or user_id <> member_user_id);

alter table public.crew_members
  drop constraint if exists crew_members_status_identity_consistency;
alter table public.crew_members
  add constraint crew_members_status_identity_consistency
  check (
    (connection_status = 'pending' and member_user_id is null and accepted_at is null)
    or (connection_status = 'accepted' and member_user_id is not null and accepted_at is not null)
    or (connection_status in ('blocked', 'removed'))
  );

-- Owners may create private pending invite records, edit their private labels,
-- and block/remove relationships. Only the server redemption function may bind
-- another account UUID or move a row into accepted status.
create or replace function public.guard_crew_member_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_is_anonymous boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
begin
  if current_setting('app.crew_acceptance', true) = '1' then
    return new;
  end if;

  if v_uid is null or v_is_anonymous then
    raise exception 'permanent_account_required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id <> v_uid then
      raise exception 'crew_owner_mismatch' using errcode = '42501';
    end if;
    if new.connection_status <> 'pending'
       or new.member_user_id is not null
       or new.accepted_at is not null then
      raise exception 'crew_acceptance_is_server_controlled' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.user_id <> old.user_id or new.id <> old.id then
    raise exception 'crew_relationship_identity_is_immutable' using errcode = '42501';
  end if;
  if old.user_id <> v_uid then
    raise exception 'crew_owner_mismatch' using errcode = '42501';
  end if;
  if new.member_user_id is distinct from old.member_user_id
     or new.accepted_at is distinct from old.accepted_at then
    raise exception 'crew_acceptance_is_server_controlled' using errcode = '42501';
  end if;
  if new.connection_status = 'accepted' and old.connection_status <> 'accepted' then
    raise exception 'crew_acceptance_is_server_controlled' using errcode = '42501';
  end if;
  if new.connection_status <> old.connection_status
     and not (
       (old.connection_status in ('pending', 'accepted') and new.connection_status in ('blocked', 'removed'))
       or (old.connection_status = 'blocked' and new.connection_status = 'removed')
     ) then
    raise exception 'invalid_crew_status_transition' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists crew_members_guard_write on public.crew_members;
create trigger crew_members_guard_write
before insert or update on public.crew_members
for each row execute function public.guard_crew_member_write();

-- Replace broad/legacy policies with permanent-account owner policies.
drop policy if exists crew_members_self on public.crew_members;
drop policy if exists crew_members_owner_select on public.crew_members;
drop policy if exists crew_members_owner_insert on public.crew_members;
drop policy if exists crew_members_owner_update on public.crew_members;
drop policy if exists crew_members_owner_delete on public.crew_members;

create policy crew_members_owner_select on public.crew_members
for select to authenticated
using (
  (select auth.uid()) = user_id
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) is false
);

create policy crew_members_owner_insert on public.crew_members
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) is false
  and connection_status = 'pending'
  and member_user_id is null
  and accepted_at is null
);

create policy crew_members_owner_update on public.crew_members
for update to authenticated
using (
  (select auth.uid()) = user_id
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) is false
)
with check (
  (select auth.uid()) = user_id
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) is false
);

create policy crew_members_owner_delete on public.crew_members
for delete to authenticated
using (
  (select auth.uid()) = user_id
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) is false
);

-- ── Server-controlled invite acceptance ─────────────────────────────────────
-- Keep the existing signature for client compatibility. p_first_name is
-- intentionally ignored; another user cannot type or overwrite account identity.
create or replace function public.redeem_crew_invite(
  p_invite_code text,
  p_first_name text default null
)
returns table (
  owner_user_id uuid,
  crew_member_id bigint,
  display_name text,
  connection_status text,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.crew_members%rowtype;
  v_existing public.crew_members%rowtype;
  v_private_name text;
  v_result_id bigint;
begin
  if v_user_id is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'permanent_account_required' using errcode = '42501';
  end if;

  if p_invite_code is null or upper(trim(p_invite_code)) !~ '^[A-Z0-9]{4,32}$' then
    raise exception 'invalid_invite_code' using errcode = '22023';
  end if;

  select * into v_invite
  from public.crew_members
  where invite_code = upper(trim(p_invite_code))
  for update;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;
  if v_invite.connection_status <> 'pending'
     or v_invite.member_user_id is not null then
    raise exception 'invite_not_pending' using errcode = '22023';
  end if;
  if v_invite.user_id = v_user_id then
    raise exception 'cannot_redeem_own_invite' using errcode = '22023';
  end if;

  select nullif(trim(private_display_name), '') into v_private_name
  from public.app_profiles
  where user_id = v_user_id
    and onboarding_complete is true;

  if v_private_name is null then
    raise exception 'completed_account_profile_required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_profiles
    where user_id = v_invite.user_id
      and onboarding_complete is true
      and nullif(trim(private_display_name), '') is not null
  ) then
    raise exception 'crew_owner_profile_incomplete' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.crew_members cm
    where cm.connection_status = 'blocked'
      and (
        (cm.user_id = v_invite.user_id and cm.member_user_id = v_user_id)
        or (cm.user_id = v_user_id and cm.member_user_id = v_invite.user_id)
      )
  ) then
    raise exception 'crew_connection_blocked' using errcode = '42501';
  end if;

  select * into v_existing
  from public.crew_members
  where user_id = v_invite.user_id
    and member_user_id = v_user_id
  for update;

  perform set_config('app.crew_acceptance', '1', true);

  if found then
    if v_existing.connection_status = 'accepted' then
      raise exception 'crew_connection_already_accepted' using errcode = '23505';
    end if;
    if v_existing.connection_status = 'blocked' then
      raise exception 'crew_connection_blocked' using errcode = '42501';
    end if;

    delete from public.crew_members
    where user_id = v_invite.user_id and id = v_invite.id;

    update public.crew_members
    set connection_status = 'accepted',
        accepted_at = now(),
        name = 'Accepted Crew member'
    where user_id = v_existing.user_id and id = v_existing.id
    returning id into v_result_id;
  else
    update public.crew_members
    set member_user_id = v_user_id,
        connection_status = 'accepted',
        accepted_at = now(),
        name = 'Accepted Crew member'
    where user_id = v_invite.user_id and id = v_invite.id
    returning id into v_result_id;
  end if;

  insert into public.crew_memberships (user_id, member_id)
  values (v_invite.user_id, v_user_id)
  on conflict (user_id, member_id) do nothing;

  return query
  select v_invite.user_id, v_result_id, v_private_name, 'accepted'::text, now();
end;
$$;

-- ── Accepted-Crew-only private identity resolver ─────────────────────────────
create or replace function public.get_crew_connection_profiles(p_user_ids uuid[])
returns table (
  user_id uuid,
  display_name text,
  avatar_emoji text,
  identity_visibility text,
  connection_status text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'permanent_account_required' using errcode = '42501';
  end if;

  return query
  with requested as (
    select distinct requested_id
    from unnest(coalesce(p_user_ids, array[]::uuid[])) requested_id
    where requested_id is not null and requested_id <> v_user_id
  ), trusted as (
    select r.requested_id
    from requested r
    where exists (
      select 1
      from public.crew_members cm
      where cm.connection_status = 'accepted'
        and (
          (cm.user_id = v_user_id and cm.member_user_id = r.requested_id)
          or (cm.user_id = r.requested_id and cm.member_user_id = v_user_id)
        )
    )
    and not exists (
      select 1
      from public.crew_members cm
      where cm.connection_status = 'blocked'
        and (
          (cm.user_id = v_user_id and cm.member_user_id = r.requested_id)
          or (cm.user_id = r.requested_id and cm.member_user_id = v_user_id)
        )
    )
  )
  select
    ap.user_id,
    coalesce(nullif(trim(ap.private_display_name), ''), 'Crew member'),
    coalesce(nullif(trim(cp.avatar_emoji), ''), '🌙'),
    'accepted_crew'::text,
    'accepted'::text
  from trusted t
  join public.app_profiles ap
    on ap.user_id = t.requested_id
   and ap.onboarding_complete is true
  left join public.circle_profiles cp on cp.user_id = ap.user_id;
end;
$$;

-- ── Unlimited, atomic, standards-checked Crew check-in sharing ───────────────
create or replace function public.create_crew_check_in(
  p_local_date date,
  p_emoji text,
  p_note text,
  p_share_with uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_check_in_id uuid;
  v_requested_count integer;
  v_accepted_count integer;
begin
  if v_user_id is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'permanent_account_required' using errcode = '42501';
  end if;

  if p_local_date is null then
    raise exception 'local_date_required' using errcode = '22023';
  end if;
  if p_emoji not in ('great', 'okay', 'low', 'need_support', 'resting') then
    raise exception 'invalid_check_in_emoji' using errcode = '22023';
  end if;
  if p_note is not null and char_length(trim(p_note)) > 280 then
    raise exception 'check_in_note_too_long' using errcode = '22023';
  end if;

  create temporary table if not exists pg_temp.requested_crew_members (
    user_id uuid primary key
  ) on commit drop;
  truncate pg_temp.requested_crew_members;

  insert into pg_temp.requested_crew_members(user_id)
  select distinct requested_id
  from unnest(coalesce(p_share_with, array[]::uuid[])) requested_id
  where requested_id is not null;

  select count(*) into v_requested_count from pg_temp.requested_crew_members;
  if v_requested_count = 0 then
    raise exception 'choose_at_least_one_crew_member' using errcode = '22023';
  end if;
  if exists (select 1 from pg_temp.requested_crew_members where user_id = v_user_id) then
    raise exception 'cannot_share_crew_check_in_with_self' using errcode = '22023';
  end if;

  select count(*) into v_accepted_count
  from pg_temp.requested_crew_members requested
  where exists (
    select 1
    from public.crew_members cm
    where cm.user_id = v_user_id
      and cm.member_user_id = requested.user_id
      and cm.connection_status = 'accepted'
  )
  and not exists (
    select 1
    from public.crew_members blocked
    where blocked.connection_status = 'blocked'
      and (
        (blocked.user_id = v_user_id and blocked.member_user_id = requested.user_id)
        or (blocked.user_id = requested.user_id and blocked.member_user_id = v_user_id)
      )
  );

  if v_accepted_count <> v_requested_count then
    raise exception 'all_recipients_must_be_accepted_crew_members' using errcode = '42501';
  end if;

  insert into public.crew_check_ins (
    owner_user_id, local_date, emoji, note
  ) values (
    v_user_id,
    p_local_date,
    p_emoji,
    nullif(left(trim(coalesce(p_note, '')), 280), '')
  ) returning id into v_check_in_id;

  insert into public.crew_check_in_shares (
    check_in_id, owner_user_id, shared_with
  )
  select v_check_in_id, v_user_id, requested.user_id
  from pg_temp.requested_crew_members requested
  on conflict (check_in_id, shared_with) do nothing;

  return v_check_in_id;
end;
$$;

revoke all on function public.redeem_crew_invite(text, text) from public, anon;
revoke all on function public.get_crew_connection_profiles(uuid[]) from public, anon;
revoke all on function public.create_crew_check_in(date, text, text, uuid[]) from public, anon;
grant execute on function public.redeem_crew_invite(text, text) to authenticated;
grant execute on function public.get_crew_connection_profiles(uuid[]) to authenticated;
grant execute on function public.create_crew_check_in(date, text, text, uuid[]) to authenticated;

comment on function public.get_crew_connection_profiles(uuid[]) is
  'Returns private display identity only for permanent accounts joined by an accepted, non-blocked Bip Crew relationship. Strangers, pending, removed, and blocked accounts receive no row.';
comment on function public.create_crew_check_in(date, text, text, uuid[]) is
  'Creates and shares one Crew check-in with any number of distinct accepted Crew members. No numeric Crew cap is applied.';

commit;
