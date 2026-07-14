-- Keep the private app-profile email mirror aligned with Supabase Auth while
-- preserving auth.users.id as the durable identity and ownership key.

begin;

create or replace function public.sync_app_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  insert into public.app_profiles(user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_app_profile_email_from_auth()
  from public, anon, authenticated;
grant execute on function public.sync_app_profile_email_from_auth()
  to service_role;

comment on function public.sync_app_profile_email_from_auth() is
  'Trigger-only Auth email mirror. Matches accounts exclusively by immutable auth.users.id; never uses email as an ownership key.';

drop trigger if exists sync_app_profile_email_on_auth_update on auth.users;
create trigger sync_app_profile_email_on_auth_update
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_app_profile_email_from_auth();

-- Repair any existing drift without changing account ownership or profile data.
update public.app_profiles p
set email = u.email,
    updated_at = now()
from auth.users u
where p.user_id = u.id
  and p.email is distinct from u.email;

-- Existing profile functions use schema-qualified objects, so lock their paths
-- against schema-shadowing while retaining their current behavior.
alter function public.initialize_app_profile()
  set search_path = pg_catalog, pg_temp;
alter function public.upsert_own_bip_profile(
  text, text, boolean, text, text, text, text, text
) set search_path = pg_catalog, pg_temp;

commit;
