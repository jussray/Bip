-- ============================================================
-- Onboarding: First Mood Log Activation Trigger
-- Migration: 20260718000001_onboarding_mood_log_trigger.sql
-- ============================================================
-- Belt-and-suspenders activation on top of the app-side
-- markActivated() call in reflection.tsx / parent-setup.tsx.
--
-- When a user inserts their FIRST row into mood_logs,
-- this trigger advances their onboarding stage to 'activated'
-- with activation_action = 'first_mood_log'.
--
-- Safe: checks that no activated_at exists before writing.
-- Assumes your mood log table is named `mood_logs` with a
-- `user_id` column. Adjust the table/column name if different.
-- ============================================================

create or replace function handle_first_mood_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count integer;
begin
  -- Only fire on the first mood log for this user
  select count(*) into existing_count
  from mood_logs
  where user_id = new.user_id;

  if existing_count > 1 then
    return new;  -- not the first log, skip
  end if;

  -- Advance onboarding stage to activated if not already there
  update user_onboarding_state
  set
    stage             = 'activated',
    activated_at      = now(),
    activation_action = 'first_mood_log',
    identity_to_activated_secs = extract(
      epoch from (now() - created_at)
    )::integer
  where
    user_id       = new.user_id
    and activated_at is null  -- idempotent: skip if already activated
    and stage not in ('activated', 'steady_state');

  return new;
end;
$$;

-- Attach to mood_logs table (adjust table name if needed)
create trigger trg_first_mood_log_activation
  after insert on public.mood_logs
  for each row
  execute function handle_first_mood_log();

comment on function handle_first_mood_log() is
  'Fires on first mood_log insert per user. '
  'Advances user_onboarding_state to activated with action=first_mood_log. '
  'Idempotent — no-op if user already activated.';
