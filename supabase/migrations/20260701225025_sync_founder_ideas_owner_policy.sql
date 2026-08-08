create policy founder_ideas_owner on public.founder_ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
