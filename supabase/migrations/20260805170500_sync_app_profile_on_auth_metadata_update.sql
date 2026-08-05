begin;

-- Anonymous accounts are inserted before they choose a durable Teen or Parent
-- side. When an anonymous user upgrades with approved account metadata, reuse the
-- existing least-privilege profile initializer so app_profiles receives the same
-- account_side, username/private display name, and email contract as a new signup.
--
-- The function intentionally ignores role, permission, verification, founder,
-- and other privileged metadata. Its execute grants remain service_role-only.
drop trigger if exists initialize_app_profile_on_auth_update on auth.users;
create trigger initialize_app_profile_on_auth_update
after update of raw_user_meta_data, email on auth.users
for each row
when (
  old.raw_user_meta_data is distinct from new.raw_user_meta_data
  or old.email is distinct from new.email
)
execute function public.initialize_app_profile();

commit;
