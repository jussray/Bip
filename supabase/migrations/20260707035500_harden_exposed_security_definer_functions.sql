begin;

revoke execute on function public.auto_resolve_issue_on_event_resolve() from public, anon, authenticated;
revoke execute on function public.enforce_circle_anonymity() from public, anon, authenticated;
revoke execute on function public.handle_bip_event_points() from public, anon, authenticated;

create or replace function public.claim_push_token(
  p_expo_push_token text,
  p_platform text,
  p_app_variant text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'authentication required';
  end if;

  if p_platform not in ('ios', 'android') then
    raise exception 'invalid platform';
  end if;

  if p_app_variant not in ('teen', 'parent') then
    raise exception 'invalid app variant';
  end if;

  insert into public.push_tokens (
    user_id,
    expo_push_token,
    platform,
    app_variant,
    enabled,
    last_seen_at
  ) values (
    v_user_id,
    p_expo_push_token,
    p_platform,
    p_app_variant,
    true,
    now()
  )
  on conflict (expo_push_token) do update
  set user_id = excluded.user_id,
      platform = excluded.platform,
      app_variant = excluded.app_variant,
      enabled = true,
      last_seen_at = now();
end;
$$;

create or replace function public.disable_push_token(p_expo_push_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'authentication required';
  end if;

  update public.push_tokens
  set enabled = false,
      last_seen_at = now()
  where expo_push_token = p_expo_push_token
    and user_id = auth.uid();
end;
$$;

revoke execute on function public.claim_push_token(text, text, text) from public, anon;
grant execute on function public.claim_push_token(text, text, text) to authenticated;

revoke execute on function public.disable_push_token(text) from public, anon;
grant execute on function public.disable_push_token(text) to authenticated;

revoke execute on function public.is_founder() from public, anon;
grant execute on function public.is_founder() to authenticated, service_role;

revoke execute on function public.upsert_control_room_issue(text, text, text, text, text, text, text, text, text, uuid, uuid, jsonb) from public, anon;
grant execute on function public.upsert_control_room_issue(text, text, text, text, text, text, text, text, text, uuid, uuid, jsonb) to authenticated, service_role;

commit;
