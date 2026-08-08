create or replace function public.auto_resolve_issue_on_event_resolve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue_id uuid;
  v_unresolved integer;
begin
  if new.resolved = true and coalesce(old.resolved, false) = false then
    select issue_id into v_issue_id
    from public.control_room_issue_events
    where event_id = new.id
    limit 1;
    if v_issue_id is not null then
      select count(*) into v_unresolved
      from public.control_room_issue_events cie
      join public.audit_events ae on ae.id = cie.event_id
      where cie.issue_id = v_issue_id and ae.resolved = false;
      if v_unresolved = 0 then
        update public.control_room_issues
        set status = 'resolved', resolved_at = now(), updated_at = now()
        where id = v_issue_id and status not in ('resolved','ignored');
      end if;
    end if;
  end if;
  return new;
end;
$$;
