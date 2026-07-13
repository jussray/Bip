-- Harden founder, Control Room, audit, and guardian-review authorization.
--
-- Scope:
--   * Reject anonymous-authenticated sessions in the shared founder helper.
--   * Keep guardian review on its existing non-anonymous founder/admin boundary.
--   * Remove unnecessary unauthenticated table privileges from audit and
--     Control Room tables.
--   * Scope Control Room RLS policies explicitly to authenticated callers.
--   * Preserve existing non-anonymous founder/admin/developer semantics.
--
-- Rollback:
--   A reviewed forward-fix may restore a narrower, documented access path.
--   Do not restore PUBLIC/anon table grants or anonymous founder eligibility.

create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1
      from public.app_profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('founder', 'admin', 'developer')
        and p.can_view_audits = true
    );
$$;

revoke all on function public.is_founder() from public;
revoke all on function public.is_founder() from anon;
grant execute on function public.is_founder() to authenticated, service_role;

comment on function public.is_founder() is
  'Returns true only for non-anonymous authenticated founder/admin/developer profiles with audit access.';

-- Unauthenticated API clients have no reason to hold table privileges here.
revoke all privileges on table public.audit_events from anon;
revoke all privileges on table public.control_room_fingerprints from anon;
revoke all privileges on table public.control_room_issue_events from anon;
revoke all privileges on table public.control_room_issue_history from anon;
revoke all privileges on table public.control_room_issues from anon;
revoke all privileges on table public.control_room_releases from anon;

-- Preserve the existing authenticated API surface. RLS remains authoritative.
grant select, insert, update, delete on table public.audit_events to authenticated;
grant select, insert, update, delete on table public.control_room_fingerprints to authenticated;
grant select, insert, update, delete on table public.control_room_issue_events to authenticated;
grant select, insert, update, delete on table public.control_room_issue_history to authenticated;
grant select, insert, update, delete on table public.control_room_issues to authenticated;
grant select, insert, update, delete on table public.control_room_releases to authenticated;

grant all privileges on table public.audit_events to service_role;
grant all privileges on table public.control_room_fingerprints to service_role;
grant all privileges on table public.control_room_issue_events to service_role;
grant all privileges on table public.control_room_issue_history to service_role;
grant all privileges on table public.control_room_issues to service_role;
grant all privileges on table public.control_room_releases to service_role;

-- audit_events has direct authenticated policies that do not call is_founder().
-- Add the same non-anonymous requirement explicitly while preserving the
-- existing role/capability split.
drop policy if exists audit_events_insert_authenticated on public.audit_events;
create policy audit_events_insert_authenticated
  on public.audit_events
  for insert
  to authenticated
  with check (
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and (user_id is null or user_id = (select auth.uid()))
  );

drop policy if exists audit_events_select_founder on public.audit_events;
create policy audit_events_select_founder
  on public.audit_events
  for select
  to authenticated
  using (
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1
      from public.app_profiles p
      where p.user_id = (select auth.uid())
        and p.can_view_audits = true
        and p.role in ('developer', 'admin', 'founder')
    )
  );

drop policy if exists audit_events_update_founder on public.audit_events;
create policy audit_events_update_founder
  on public.audit_events
  for update
  to authenticated
  using (
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1
      from public.app_profiles p
      where p.user_id = (select auth.uid())
        and p.can_manage_app = true
        and p.role in ('admin', 'founder')
    )
  )
  with check (
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1
      from public.app_profiles p
      where p.user_id = (select auth.uid())
        and p.can_manage_app = true
        and p.role in ('admin', 'founder')
    )
  );

drop policy if exists audit_events_delete_founder on public.audit_events;
create policy audit_events_delete_founder
  on public.audit_events
  for delete
  to authenticated
  using (
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1
      from public.app_profiles p
      where p.user_id = (select auth.uid())
        and p.can_manage_app = true
        and p.role = 'founder'
    )
  );

-- Control Room policies previously targeted PUBLIC. Keep the same founder
-- predicate but scope the policy itself to authenticated sessions.
drop policy if exists registry_access on public.control_room_fingerprints;
create policy registry_access
  on public.control_room_fingerprints
  for all
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());

drop policy if exists control_room_issue_events_founder on public.control_room_issue_events;
create policy control_room_issue_events_founder
  on public.control_room_issue_events
  for all
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());

drop policy if exists issue_history_founder on public.control_room_issue_history;
create policy issue_history_founder
  on public.control_room_issue_history
  for all
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());

drop policy if exists control_room_issues_founder on public.control_room_issues;
create policy control_room_issues_founder
  on public.control_room_issues
  for all
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());

drop policy if exists "Founder: releases" on public.control_room_releases;
create policy "Founder: releases"
  on public.control_room_releases
  for all
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());
