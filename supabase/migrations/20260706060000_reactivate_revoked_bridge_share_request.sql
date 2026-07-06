begin;

-- create_bridge_share_request's ON CONFLICT previously only bumped
-- updated_at, so re-sharing a journal entry (or any source) after its prior
-- request was revoked/expired/failed returned that same terminal row
-- untouched — the teen saw a success response but the parent could never
-- read it, because every parent-facing RLS policy excludes revoked/expired
-- requests regardless of what the client believes happened.
--
-- Reactivate in place on conflict: same request id and idempotency key
-- (so any existing bridge_share_sources / bridge_summaries rows for it
-- stay attached), but status/revoked_at/failure_code/consented_at reset as
-- if newly created, and parent_user_id refreshed in case the teen's active
-- parent link changed since the original share. Non-terminal rows (still
-- pending/processing/ready/viewed) keep their existing behavior of just
-- bumping updated_at — an active share isn't touched by a repeat call.
create or replace function public.create_bridge_share_request(
  p_parent_user_id uuid,
  p_idempotency_key text,
  p_sources jsonb,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teen_user_id uuid := auth.uid();
  v_request_id uuid;
  v_source jsonb;
begin
  if v_teen_user_id is null then
    raise exception 'unauthorized';
  end if;

  if p_parent_user_id is null or p_parent_user_id = v_teen_user_id then
    raise exception 'invalid_parent';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'invalid_idempotency_key';
  end if;

  if jsonb_typeof(p_sources) <> 'array' or jsonb_array_length(p_sources) = 0 then
    raise exception 'sources_required';
  end if;

  if jsonb_array_length(p_sources) > 20 then
    raise exception 'too_many_sources';
  end if;

  if not exists (
    select 1 from public.parent_links pl
    where pl.teen_user_id = v_teen_user_id
      and pl.parent_user_id = p_parent_user_id
      and pl.status = 'active'
      and pl.is_active = true
  ) then
    raise exception 'active_parent_link_required';
  end if;

  insert into public.bridge_share_requests as r (
    teen_user_id, parent_user_id, status, idempotency_key, consented_at, expires_at
  ) values (
    v_teen_user_id, p_parent_user_id, 'pending', trim(p_idempotency_key), now(), p_expires_at
  )
  on conflict (teen_user_id, idempotency_key) do update
    set parent_user_id = excluded.parent_user_id,
        status = case
          when r.status in ('revoked', 'expired', 'failed') then 'pending'
          else r.status
        end,
        revoked_at = case
          when r.status in ('revoked', 'expired', 'failed') then null
          else r.revoked_at
        end,
        failure_code = case
          when r.status in ('revoked', 'expired', 'failed') then null
          else r.failure_code
        end,
        consented_at = case
          when r.status in ('revoked', 'expired', 'failed') then now()
          else r.consented_at
        end,
        expires_at = excluded.expires_at,
        updated_at = now()
  returning id into v_request_id;

  for v_source in select value from jsonb_array_elements(p_sources)
  loop
    if coalesce(v_source->>'kind','') not in ('journal','mood','goal','scrapbook')
       or nullif(trim(v_source->>'sourceId'),'') is null then
      raise exception 'invalid_source';
    end if;

    insert into public.bridge_share_sources (request_id, source_kind, source_id)
    values (v_request_id, v_source->>'kind', trim(v_source->>'sourceId'))
    on conflict (request_id, source_kind, source_id) do nothing;
  end loop;

  return v_request_id;
end;
$$;

revoke execute on function public.create_bridge_share_request(uuid,text,jsonb,timestamptz) from public, anon;
grant execute on function public.create_bridge_share_request(uuid,text,jsonb,timestamptz) to authenticated;

commit;
