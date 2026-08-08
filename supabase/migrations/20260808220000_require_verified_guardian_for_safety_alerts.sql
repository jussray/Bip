begin;

-- Safety alerts cross a high-trust boundary. A parent UUID supplied by a client
-- is never sufficient authority by itself: the relationship must still be
-- active and the parent account must currently be a verified guardian.
create or replace function public.has_verified_guardian_link(
  p_teen_user_id uuid,
  p_parent_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p_teen_user_id is not null
    and p_parent_user_id is not null
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and (
      coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or auth.uid() = p_teen_user_id
      or auth.uid() = p_parent_user_id
    )
    and exists (
      select 1
      from public.parent_links pl
      join public.app_profiles ap
        on ap.user_id = pl.parent_user_id
      join public.account_verification av
        on av.user_id = pl.parent_user_id
      where pl.teen_user_id = p_teen_user_id
        and pl.parent_user_id = p_parent_user_id
        and pl.status = 'active'
        and pl.is_active = true
        and ap.account_side = 'parent'
        and ap.onboarding_complete is true
        and av.verification_state = 'VERIFIED_GUARDIAN'
    );
$$;

revoke all on function public.has_verified_guardian_link(uuid, uuid)
  from public, anon;
grant execute on function public.has_verified_guardian_link(uuid, uuid)
  to authenticated, service_role;

comment on function public.has_verified_guardian_link(uuid, uuid) is
  'Caller-scoped relationship guard: true only for an active teen-parent link whose parent account is currently VERIFIED_GUARDIAN.';

alter policy "safety alerts insert teen only"
on public.safety_alerts
to authenticated
with check (
  public.is_non_anonymous_user()
  and teen_user_id = auth.uid()
  and public.has_verified_guardian_link(teen_user_id, parent_user_id)
);

alter policy "safety alerts select linked teen or parent"
on public.safety_alerts
to authenticated
using (
  public.is_non_anonymous_user()
  and (
    teen_user_id = auth.uid()
    or (
      parent_user_id = auth.uid()
      and public.has_verified_guardian_link(teen_user_id, parent_user_id)
    )
  )
);

alter policy "safety alerts update parent or teen"
on public.safety_alerts
to authenticated
using (
  public.is_non_anonymous_user()
  and (
    teen_user_id = auth.uid()
    or (
      parent_user_id = auth.uid()
      and public.has_verified_guardian_link(teen_user_id, parent_user_id)
    )
  )
)
with check (
  public.is_non_anonymous_user()
  and public.has_verified_guardian_link(teen_user_id, parent_user_id)
  and (
    teen_user_id = auth.uid()
    or parent_user_id = auth.uid()
  )
);

commit;
