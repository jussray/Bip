create or replace function public.review_task_submission(p_submission_id uuid, p_approve boolean, p_review_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent uuid := auth.uid();
  v_teen uuid;
  v_task_id uuid;
  v_points integer;
begin
  if v_parent is null then
    raise exception 'authentication required';
  end if;

  select ts.teen_id, ts.task_id, bt.point_value
    into v_teen, v_task_id, v_points
  from public.task_submissions ts
  join public.bip_tasks bt on bt.id = ts.task_id
  where ts.id = p_submission_id
    and ts.status = 'pending'
  for update of ts, bt;

  if not found then
    raise exception 'submission not pending';
  end if;

  if not exists (
    select 1
    from public.parent_links pl
    where pl.teen_user_id = v_teen
      and pl.parent_user_id = v_parent
      and pl.status = 'active'
  ) then
    raise exception 'not authorized';
  end if;

  update public.task_submissions
  set status = case when p_approve then 'approved' else 'rejected' end,
      reviewed_by = v_parent,
      reviewed_at = now(),
      review_note = p_review_note
  where id = p_submission_id;

  update public.bip_tasks
  set status = case when p_approve then 'completed' else 'rejected' end,
      updated_at = now()
  where id = v_task_id;

  if p_approve then
    insert into public.bip_events(user_id, event_type, meta)
    values (v_teen, 'task_completed', jsonb_build_object('task_id', v_task_id, 'submission_id', p_submission_id, 'approved_by', v_parent));

    if coalesce(v_points, 0) > 0 then
      insert into public.point_transactions(user_id, amount, reason, transaction_type, source_type, source_id, metadata)
      values (v_teen, v_points, 'Completed an approved Bip task', 'earn', 'bip_task', v_task_id::text, jsonb_build_object('submission_id', p_submission_id, 'approved_by', v_parent));
    end if;
  end if;

  return jsonb_build_object('approved', p_approve, 'task_id', v_task_id, 'submission_id', p_submission_id);
end;
$$;

do $$
begin
  execute 'revoke execute on function public.review_task_submission(uuid,boolean,text) from public';
  execute 'revoke execute on function public.review_task_submission(uuid,boolean,text) from anon';
  execute 'grant execute on function public.review_task_submission(uuid,boolean,text) to authenticated';
end
$$;
