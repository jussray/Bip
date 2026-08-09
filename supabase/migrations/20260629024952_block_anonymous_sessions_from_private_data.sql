begin;

-- Restore the canonical permanent-account guard that exists in production
-- before the later private-data RLS hardening migrations consume it.
create or replace function public.is_non_anonymous_user()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;

revoke all on function public.is_non_anonymous_user() from public, anon;
grant execute on function public.is_non_anonymous_user() to authenticated, service_role;

comment on function public.is_non_anonymous_user() is
  'Returns true only for authenticated sessions whose Supabase JWT is not anonymous.';

commit;
