begin;

-- Journal entries are shared by Teen Pages and Parent Pages. The account owner
-- remains the only reader/writer through the existing owner RLS policies; this
-- column separates the two product surfaces without creating a second notebook
-- table or weakening privacy.
alter table public.journal_entries
  add column if not exists owner_side text not null default 'teen',
  add column if not exists source text,
  add column if not exists entry_mode text,
  add column if not exists mood_tag text,
  add column if not exists locked boolean not null default false,
  add column if not exists media_type text,
  add column if not exists sekret_avatar_state text;

do $$
begin
  alter table public.journal_entries
    add constraint journal_entries_owner_side_check
    check (owner_side in ('teen', 'parent'));
exception
  when duplicate_object then null;
end
$$;

create index if not exists journal_entries_owner_side_created_idx
  on public.journal_entries (user_id, owner_side, created_at desc);

-- One reaction per signed-in account and public post. A later reaction replaces
-- the previous reaction instead of inflating totals by repeated taps.
create unique index if not exists circle_reactions_unique_user_post
  on public.circle_reactions (post_id, post_type, user_id);

create or replace function public.react_to_public_circle_post(
  p_post_id bigint,
  p_emoji text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_counts jsonb;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'permanent account required' using errcode = '42501';
  end if;

  if p_emoji not in ('felt', 'comfort', 'proud', 'stay') then
    raise exception 'unsupported reaction' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.public_circle_posts
    where id = p_post_id
      and safety_flagged is false
  ) then
    raise exception 'post not found' using errcode = 'P0002';
  end if;

  insert into public.circle_reactions (post_id, post_type, user_id, emoji)
  values (p_post_id, 'public', v_user_id, p_emoji)
  on conflict (post_id, post_type, user_id)
  do update set
    emoji = excluded.emoji,
    created_at = now();

  select jsonb_build_object(
    'felt', count(*) filter (where emoji = 'felt'),
    'comfort', count(*) filter (where emoji = 'comfort'),
    'proud', count(*) filter (where emoji = 'proud'),
    'stay', count(*) filter (where emoji = 'stay')
  )
  into v_counts
  from public.circle_reactions
  where post_id = p_post_id
    and post_type = 'public';

  update public.public_circle_posts
  set reactions = v_counts
  where id = p_post_id;

  return v_counts;
end;
$$;

revoke all on function public.react_to_public_circle_post(bigint, text) from public;
revoke all on function public.react_to_public_circle_post(bigint, text) from anon;
grant execute on function public.react_to_public_circle_post(bigint, text) to authenticated;

commit;
