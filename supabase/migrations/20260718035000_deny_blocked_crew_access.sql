begin;

-- Defense in depth for Crew privacy. The relationship cleanup trigger revokes
-- active shares when either participant blocks or leaves, but read and insert
-- policies also deny access whenever a blocked row exists in either direction.

create or replace function public.crew_pair_is_unblocked(
  p_owner_user_id uuid,
  p_member_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p_owner_user_id is not null
    and p_member_user_id is not null
    and p_owner_user_id <> p_member_user_id
    and not exists (
      select 1
      from public.crew_members blocked
      where blocked.connection_status = 'blocked'
        and (
          (blocked.user_id = p_owner_user_id and blocked.member_user_id = p_member_user_id)
          or (blocked.user_id = p_member_user_id and blocked.member_user_id = p_owner_user_id)
        )
    );
$$;

revoke all on function public.crew_pair_is_unblocked(uuid, uuid)
  from public, anon;
grant execute on function public.crew_pair_is_unblocked(uuid, uuid)
  to authenticated;

comment on function public.crew_pair_is_unblocked(uuid, uuid) is
  'Returns false when either direction of a Crew relationship is blocked. Used only as a policy helper; it does not create or modify relationship state.';

drop policy if exists crew_check_in_shares_crew_read on public.crew_check_in_shares;
create policy crew_check_in_shares_crew_read on public.crew_check_in_shares
  for select to authenticated
  using (
    auth.uid() = shared_with
    and status = 'active'
    and public.crew_pair_is_unblocked(owner_user_id, auth.uid())
    and exists (
      select 1
      from public.crew_check_ins ci
      join public.crew_members cm
        on cm.user_id = ci.owner_user_id
       and cm.member_user_id = auth.uid()
       and cm.connection_status = 'accepted'
      where ci.id = crew_check_in_shares.check_in_id
        and ci.owner_user_id = crew_check_in_shares.owner_user_id
        and ci.status = 'active'
    )
  );

drop policy if exists crew_check_ins_crew_read on public.crew_check_ins;
create policy crew_check_ins_crew_read on public.crew_check_ins
  for select to authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.crew_check_in_shares s
      join public.crew_members cm
        on cm.user_id = s.owner_user_id
       and cm.member_user_id = auth.uid()
       and cm.connection_status = 'accepted'
      where s.check_in_id = crew_check_ins.id
        and s.owner_user_id = crew_check_ins.owner_user_id
        and s.shared_with = auth.uid()
        and s.status = 'active'
        and public.crew_pair_is_unblocked(s.owner_user_id, auth.uid())
    )
  );

drop policy if exists crew_encouragements_sender_insert on public.crew_encouragements;
create policy crew_encouragements_sender_insert on public.crew_encouragements
  for insert to authenticated
  with check (
    auth.uid() = sender_user_id
    and recipient_user_id <> sender_user_id
    and public.crew_pair_is_unblocked(recipient_user_id, sender_user_id)
    and exists (
      select 1
      from public.crew_check_in_shares s
      join public.crew_check_ins ci
        on ci.id = s.check_in_id
       and ci.owner_user_id = s.owner_user_id
       and ci.status = 'active'
      join public.crew_members cm
        on cm.user_id = s.owner_user_id
       and cm.member_user_id = auth.uid()
       and cm.connection_status = 'accepted'
      where s.check_in_id = crew_encouragements.check_in_id
        and s.shared_with = auth.uid()
        and s.owner_user_id = recipient_user_id
        and s.status = 'active'
    )
  );

commit;
