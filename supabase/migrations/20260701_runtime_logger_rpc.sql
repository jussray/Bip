create or replace function public.log_control_room_runtime_event(
  p_user_id uuid,
  p_event_type text,
  p_screen text,
  p_severity text,
  p_message text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_event_id uuid;
begin
  insert into public.audit_events (
    user_id,
    event_type,
    screen,
    severity,
    message,
    metadata
  ) values (
    p_user_id,
    p_event_type,
    p_screen,
    p_severity,
    p_message,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;
