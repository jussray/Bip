create table if not exists public.control_room_issue_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.control_room_issues(id) on delete cascade,
  event_id uuid not null references public.audit_events(id) on delete cascade,
  linked_at timestamptz not null default now(),
  unique (issue_id, event_id)
);
alter table public.control_room_issue_events enable row level security;
create policy control_room_issue_events_founder on public.control_room_issue_events for all using (public.is_founder()) with check (public.is_founder());
