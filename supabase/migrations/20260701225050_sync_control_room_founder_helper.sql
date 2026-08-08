create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_profiles
    where user_id = auth.uid()
      and role in ('founder','admin','developer')
      and can_view_audits = true
  );
$$;
