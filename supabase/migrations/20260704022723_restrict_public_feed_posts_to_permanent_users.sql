begin;

drop policy if exists "Only permanent users can post to the public feed"
  on public.public_circle_posts;

create policy "Only permanent users can post to the public feed"
on public.public_circle_posts
as restrictive
for insert
to authenticated
with check (
  coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

drop policy if exists "Anonymous and permanent users can view the public feed"
  on public.public_circle_posts;

create policy "Anonymous and permanent users can view the public feed"
on public.public_circle_posts
for select
to authenticated
using (true);

commit;
