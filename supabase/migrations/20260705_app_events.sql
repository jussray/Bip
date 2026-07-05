-- Retention event log
create table if not exists app_events (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  event_type  text not null,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index if not exists app_events_user_type_time
  on app_events (user_id, event_type, created_at);

alter table app_events enable row level security;

create policy "users insert own events"
  on app_events for insert
  with check (auth.uid() = user_id);

-- D7 retention view
create or replace view v_d7_retention as
select
  count(distinct d7.user_id)::float /
  nullif(count(distinct d0.user_id), 0) * 100 as d7_retention_pct,
  count(distinct d0.user_id) as cohort_size
from (
  select distinct user_id, date(created_at) as day0
  from app_events
  where event_type = 'session_start'
) d0
left join (
  select distinct user_id, date(created_at) as day_n
  from app_events
  where event_type = 'session_start'
) d7
  on d0.user_id = d7.user_id
 and d7.day_n between d0.day0 + 6 and d0.day0 + 8;

-- WAU trend view
create or replace view v_wau_trend as
select
  date_trunc('week', created_at) as week_start,
  count(distinct user_id) as wau
from app_events
where event_type = 'session_start'
group by 1
order by 1;
