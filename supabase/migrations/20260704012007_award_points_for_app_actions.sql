create table if not exists public.app_point_awards (
  activity_event_id bigint primary key references public.activity_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  points_awarded integer not null check (points_awarded > 0),
  awarded_at timestamptz not null default now()
);

alter table public.app_point_awards enable row level security;

create policy app_point_awards_owner_read
on public.app_point_awards
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.award_points_for_app_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer := case NEW.event_type
    when 'journal_completed' then 5
    when 'voice_bip_completed' then 5
    when 'comfort_tool_used' then 3
    when 'goal_progress' then 5
    when 'streak_milestone' then 10
    when 'mood_pattern' then 2
    when 'oracle_understanding' then 3
    when 'bridge_share_created' then 5
    when 'crew_check_in' then 3
    when 'reward_milestone' then 5
    else 0
  end;
begin
  if v_points <= 0 then
    return NEW;
  end if;

  insert into public.app_point_awards(activity_event_id, user_id, event_type, points_awarded)
  values (NEW.id, NEW.user_id, NEW.event_type, v_points)
  on conflict (activity_event_id) do nothing;

  if found then
    insert into public.point_transactions(
      user_id,
      amount,
      reason,
      transaction_type,
      source_type,
      source_id,
      metadata
    )
    values (
      NEW.user_id,
      v_points,
      'Earned points from a Bip app activity',
      'earn',
      'app_action',
      NEW.id::text,
      jsonb_build_object(
        'activity_event_id', NEW.id,
        'event_type', NEW.event_type,
        'label', NEW.label
      )
    );
  end if;

  return NEW;
end;
$$;

revoke all on function public.award_points_for_app_activity() from public, anon, authenticated;

drop trigger if exists activity_events_award_points on public.activity_events;
create trigger activity_events_award_points
after insert on public.activity_events
for each row execute function public.award_points_for_app_activity();

comment on table public.app_point_awards is
  'One immutable point award per activity event. App actions earn regular Bip points; parent-created chores remain separate bonus entries with source_type bip_task.';
