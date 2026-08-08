create or replace function public.submit_bip_task(p_task_id uuid, p_note text default null, p_evidence_url text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_submission uuid;
  v_requires_approval boolean;
  v_points integer;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select requires_approval, point_value
    into v_requires_approval, v_points
  from public.bip_tasks
  where id = p_task_id
    and teen_id = v_user
    and status in ('active','rejected')
  for update;

  if not found then
    raise exception 'task not available';
  end if;

  insert into public.task_submissions(task_id, teen_id, note, evidence_url, status)
  values (p_task_id, v_user, p_note, p_evidence_url,
          case when v_requires_approval then 'pending' else 'approved' end)
  returning id into v_submission;

  update public.bip_tasks
  set status = case when v_requires_approval then 'submitted' else 'completed' end,
      updated_at = now()
  where id = p_task_id;

  if not v_requires_approval then
    insert into public.bip_events(user_id, event_type, meta)
    values (v_user, 'task_completed', jsonb_build_object('task_id', p_task_id, 'submission_id', v_submission));

    if coalesce(v_points, 0) > 0 then
      insert into public.point_transactions(user_id, amount, reason, transaction_type, source_type, source_id, metadata)
      values (v_user, v_points, 'Completed a Bip task', 'earn', 'bip_task', p_task_id::text, jsonb_build_object('submission_id', v_submission));
    end if;
  end if;

  return v_submission;
end;
$$;
