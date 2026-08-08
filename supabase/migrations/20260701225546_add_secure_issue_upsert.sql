create or replace function public.upsert_control_room_issue(
  p_fingerprint text,
  p_source text,
  p_category text,
  p_severity text,
  p_status text,
  p_title text,
  p_summary text,
  p_suggested_fix text,
  p_affected_surface text,
  p_affected_user_id uuid,
  p_event_id uuid,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_issue_id uuid;
  v_auth_user uuid := auth.uid();
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_event_user uuid;
begin
  if p_event_id is not null then
    select user_id into v_event_user from public.audit_events where id = p_event_id;
    if not (v_role = 'service_role' or public.is_founder() or (v_auth_user is not null and v_event_user = v_auth_user)) then
      raise exception 'not allowed to normalize this event' using errcode = '42501';
    end if;
  elsif not (v_role = 'service_role' or public.is_founder()) then
    raise exception 'event id required' using errcode = '42501';
  end if;

  select id into v_issue_id
  from public.control_room_issues
  where fingerprint = p_fingerprint
    and status not in ('resolved','ignored')
  limit 1;

  if v_issue_id is null then
    insert into public.control_room_issues (
      fingerprint, source, category, severity, status, title, summary,
      suggested_fix, affected_surface, affected_users, occurrence_count,
      first_seen_at, last_seen_at, metadata
    ) values (
      p_fingerprint, p_source, p_category, p_severity, p_status, p_title, p_summary,
      p_suggested_fix, p_affected_surface,
      case when p_affected_user_id is null then 0 else 1 end,
      1, now(), now(), coalesce(p_metadata, '{}'::jsonb)
    ) returning id into v_issue_id;
  else
    update public.control_room_issues
    set occurrence_count = occurrence_count + 1,
        last_seen_at = now(),
        severity = case
          when severity = 'critical' or p_severity = 'critical' then 'critical'
          when severity = 'error' or p_severity = 'error' then 'error'
          when severity = 'warning' or p_severity = 'warning' then 'warning'
          else 'info'
        end,
        updated_at = now()
    where id = v_issue_id;
  end if;

  if p_event_id is not null then
    insert into public.control_room_issue_events (issue_id, event_id)
    values (v_issue_id, p_event_id)
    on conflict do nothing;
  end if;

  return v_issue_id;
end;
$$;
