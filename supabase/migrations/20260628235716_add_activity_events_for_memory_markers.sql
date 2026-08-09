create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  source_type text not null,
  source_id text,
  label text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_label_length check (char_length(label) between 1 and 80),
  constraint activity_events_summary_length check (summary is null or char_length(summary) <= 240),
  constraint activity_events_event_type_check check (event_type in (
    'journal_completed','voice_bip_completed','comfort_tool_used','goal_progress',
    'streak_milestone','mood_pattern','oracle_understanding','bridge_share_created',
    'crew_check_in','reward_milestone'
  )),
  constraint activity_events_source_type_check check (source_type in (
    'journal','voice_bip','comfort','goal','streak','mood','oracle','bridge','crew','rewards'
  ))
);

alter table public.activity_events enable row level security;

drop policy if exists activity_events_owner_select on public.activity_events;
create policy activity_events_owner_select
on public.activity_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists activity_events_owner_insert on public.activity_events;
create policy activity_events_owner_insert
on public.activity_events
for insert
to authenticated
with check (auth.uid() = user_id);

revoke all on public.activity_events from anon;
grant select, insert on public.activity_events to authenticated;

create index if not exists activity_events_user_created_idx
on public.activity_events (user_id, created_at desc);
