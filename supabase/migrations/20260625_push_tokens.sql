-- Se'kret Bip — push_tokens table
-- Stores one Expo push token per user (upserted on each app launch).
-- Safety-scan edge function uses service_role to query parent tokens.

create table if not exists public.push_tokens (
  id          bigserial     primary key,
  user_id     uuid          not null references auth.users(id) on delete cascade,
  token       text          not null,
  platform    text          not null check (platform in ('ios', 'android', 'web')),
  updated_at  timestamptz   not null default now(),
  constraint push_tokens_user_unique unique (user_id)
);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_self" on public.push_tokens;
create policy "push_tokens_self" on public.push_tokens
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
