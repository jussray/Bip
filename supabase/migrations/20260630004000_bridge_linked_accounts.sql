begin;

create table if not exists public.bridge_messages (
  id uuid primary key default gen_random_uuid(),
  teen_user_id uuid not null references auth.users(id) on delete cascade,
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('s2tell','note','reply','shared_moment')),
  body text not null check (char_length(body) between 1 and 5000),
  tone text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint bridge_messages_sender_is_participant
    check (sender_user_id = teen_user_id or sender_user_id = parent_user_id)
);

create index if not exists bridge_messages_teen_created_idx
  on public.bridge_messages (teen_user_id, created_at desc);
create index if not exists bridge_messages_parent_created_idx
  on public.bridge_messages (parent_user_id, created_at desc);

alter table public.bridge_messages enable row level security;

drop policy if exists bridge_messages_linked_select on public.bridge_messages;
create policy bridge_messages_linked_select
on public.bridge_messages
for select
using (
  auth.uid() in (teen_user_id, parent_user_id)
  and exists (
    select 1
    from public.parent_links pl
    where pl.teen_user_id = bridge_messages.teen_user_id
      and pl.parent_user_id = bridge_messages.parent_user_id
      and pl.status = 'active'
      and pl.is_active = true
  )
);

drop policy if exists bridge_messages_linked_insert on public.bridge_messages;
create policy bridge_messages_linked_insert
on public.bridge_messages
for insert
with check (
  auth.uid() = sender_user_id
  and auth.uid() in (teen_user_id, parent_user_id)
  and exists (
    select 1
    from public.parent_links pl
    where pl.teen_user_id = bridge_messages.teen_user_id
      and pl.parent_user_id = bridge_messages.parent_user_id
      and pl.status = 'active'
      and pl.is_active = true
  )
);

drop policy if exists bridge_messages_recipient_update on public.bridge_messages;
create policy bridge_messages_recipient_update
on public.bridge_messages
for update
using (
  auth.uid() in (teen_user_id, parent_user_id)
  and auth.uid() <> sender_user_id
)
with check (
  auth.uid() in (teen_user_id, parent_user_id)
  and auth.uid() <> sender_user_id
);

grant select, insert, update on public.bridge_messages to authenticated;

commit;
