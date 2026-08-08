create policy issue_history_founder on public.control_room_issue_history for all to authenticated using (public.is_founder()) with check (public.is_founder());
