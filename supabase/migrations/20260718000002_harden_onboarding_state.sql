begin;

-- `user_onboarding_state` is client-reported product telemetry and routing state.
-- It is not relationship, verification, consent, or authorization authority.
-- The database still enforces permanent-account ownership and monotonic updates
-- so stale clients cannot regress the current stage or rewrite another user.

alter table public.user_onboarding_state enable row level security;

revoke all on table public.user_onboarding_state from public, anon, authenticated;
grant select, insert, update on table public.user_onboarding_state to authenticated;

drop policy if exists "Users can view own onboarding state" on public.user_onboarding_state;
drop policy if exists "Users can insert own onboarding state" on public.user_onboarding_state;
drop policy if exists "Users can update own onboarding state" on public.user_onboarding_state;
drop policy if exists "Service role can read all onboarding states" on public.user_onboarding_state;
drop policy if exists onboarding_state_permanent_owner_select on public.user_onboarding_state;
drop policy if exists onboarding_state_permanent_owner_insert on public.user_onboarding_state;
drop policy if exists onboarding_state_permanent_owner_update on public.user_onboarding_state;

create policy onboarding_state_permanent_owner_select
on public.user_onboarding_state
for select
to authenticated
using (
  public.is_non_anonymous_user()
  and (select auth.uid()) = user_id
);

create policy onboarding_state_permanent_owner_insert
on public.user_onboarding_state
for insert
to authenticated
with check (
  public.is_non_anonymous_user()
  and (select auth.uid()) = user_id
);

create policy onboarding_state_permanent_owner_update
on public.user_onboarding_state
for update
to authenticated
using (
  public.is_non_anonymous_user()
  and (select auth.uid()) = user_id
)
with check (
  public.is_non_anonymous_user()
  and (select auth.uid()) = user_id
);

create or replace function public.onboarding_stage_rank(p_stage public.onboarding_stage)
returns integer
language sql
immutable
strict
set search_path = pg_catalog, public
as $$
  select case p_stage
    when 'pre_signup' then 0
    when 'signed_up' then 1
    when 'consent_complete' then 2
    when 'age_verified' then 3
    when 'role_selected' then 4
    when 'name_set' then 5
    when 'identity_set' then 6
    when 'reflection_complete' then 7
    when 'parent_link_sent' then 8
    when 'parent_linked' then 9
    when 'parent_link_skipped' then 9
    when 'parent_setup_complete' then 10
    when 'activated' then 11
    when 'steady_state' then 12
  end
$$;

create or replace function public.enforce_onboarding_state_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'onboarding user_id is immutable'
        using errcode = '23514';
    end if;

    if public.onboarding_stage_rank(new.stage)
       < public.onboarding_stage_rank(old.stage) then
      raise exception 'onboarding stage cannot move backward'
        using errcode = '23514';
    end if;

    if old.role <> 'unknown' and new.role is distinct from old.role then
      raise exception 'onboarding role cannot change after assignment'
        using errcode = '23514';
    end if;

    if old.activated_at is not null and new.activated_at is null then
      raise exception 'activated_at cannot be cleared'
        using errcode = '23514';
    end if;

    if old.completed_at is not null and new.completed_at is null then
      raise exception 'completed_at cannot be cleared'
        using errcode = '23514';
    end if;
  end if;

  if new.age_bucket is not null
     and new.age_bucket not in ('13-15', '16-17', '18-19') then
    raise exception 'invalid onboarding age bucket'
      using errcode = '23514';
  end if;

  if new.device_platform is not null
     and char_length(new.device_platform) > 128 then
    raise exception 'onboarding device platform is too long'
      using errcode = '23514';
  end if;

  if new.referral_source is not null
     and char_length(new.referral_source) > 128 then
    raise exception 'onboarding referral source is too long'
      using errcode = '23514';
  end if;

  if new.activation_action is not null
     and (
       char_length(new.activation_action) > 64
       or new.activation_action !~ '^[a-z0-9_]+$'
     ) then
    raise exception 'invalid onboarding activation action'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists onboarding_state_transition_guard
on public.user_onboarding_state;

create trigger onboarding_state_transition_guard
before insert or update on public.user_onboarding_state
for each row
execute function public.enforce_onboarding_state_transition();

-- Trigger functions do not need client-callable EXECUTE privileges. Keep their
-- execution attached to their table triggers and remove advisor noise / drift.
revoke all on function public.onboarding_stage_rank(public.onboarding_stage)
from public, anon, authenticated;
revoke all on function public.enforce_onboarding_state_transition()
from public, anon, authenticated;
revoke all on function public.update_onboarding_updated_at()
from public, anon, authenticated;
revoke all on function public.handle_first_mood_log()
from public, anon, authenticated;

comment on table public.user_onboarding_state is
  'Client-reported onboarding progress for product routing and aggregate analysis. Not consent, verification, relationship, or authorization authority. Permanent owners may read and report forward progress only.';

comment on function public.enforce_onboarding_state_transition() is
  'Fails closed on cross-user rewrites, stage regression, assigned-role changes, timestamp clearing, and unbounded client-reported metadata.';

commit;
