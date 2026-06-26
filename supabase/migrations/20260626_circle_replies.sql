-- Se'kret Bip — circle_replies table
-- Stores comfort-text and voice replies on circle posts.
-- user_id is nullable (written by authenticated user but displayed anonymously).

create table if not exists public.circle_replies (
  id            bigserial     primary key,
  post_id       bigint        not null,
  post_type     text          not null check (post_type in ('public', 'friends', 'crew', 'parent')),
  user_id       uuid          references auth.users(id) on delete set null,
  reply_mode    text          not null check (reply_mode in ('comfort', 'voice', 'support', 'stay')),
  text          text,
  voice_url     text,
  duration_secs integer,
  created_at    timestamptz   not null default now()
);

alter table public.circle_replies enable row level security;

drop policy if exists "circle_replies_read"  on public.circle_replies;
drop policy if exists "circle_replies_write" on public.circle_replies;

-- Anyone authenticated can read replies on any post
create policy "circle_replies_read" on public.circle_replies
  for select using (auth.role() = 'authenticated');

-- Users can write their own replies
create policy "circle_replies_write" on public.circle_replies
  for insert with check (auth.uid() = user_id);
