drop policy if exists app_profiles_update_own_limited on public.app_profiles;

revoke update, insert, delete on public.app_profiles from authenticated;
grant select on public.app_profiles to authenticated;

grant insert on public.audit_events to authenticated;
grant select, update, delete on public.audit_events to authenticated;
