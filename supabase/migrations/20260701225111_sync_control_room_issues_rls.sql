alter table public.control_room_issues enable row level security;
create policy control_room_issues_founder on public.control_room_issues for all using (public.is_founder()) with check (public.is_founder());
