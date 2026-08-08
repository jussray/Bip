create policy point_transactions_owner_read
on public.point_transactions
for select
to authenticated
using (auth.uid() = user_id);
