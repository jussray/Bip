-- ============================================================
-- Onboarding State Machine — Se'kret Bip
-- Migration: 20260718000000_onboarding_state.sql
-- ============================================================
-- Tracks each user's progress through the onboarding flow.
-- States map 1-to-1 with Expo Router screens in app/(onboarding)/
-- ============================================================

create type onboarding_stage as enum (
  'pre_signup',
  'signed_up',
  'consent_complete',
  'age_verified',
  'role_selected',      -- 'teen' | 'parent'
  'name_set',
  'identity_set',
  'reflection_complete',
  'parent_link_sent',   -- teen path: parent invite dispatched
  'parent_setup_done',  -- parent path: parent account configured
  'activated',          -- first core action completed
  'steady_state'        -- fully onboarded, using the app normally
);

create type user_role as enum ('teen', 'parent', 'unknown');

create table if not exists public.user_onboarding_state (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  stage           onboarding_stage not null default 'signed_up',
  role            user_role not null default 'unknown',

  -- Activation tracking
  activated_at    timestamptz,
  activation_action text, -- what action triggered activation (e.g. 'first_mood_log', 'first_journal')

  -- Segmentation signals (captured during onboarding)
  age_bucket      text,   -- e.g. '13-15', '16-17', '18+'
  referral_source text,   -- utm_source or app store referral
  device_platform text,   -- 'ios' | 'android'

  -- Parent link
  parent_link_code   text unique,
  parent_linked_at   timestamptz,
  linked_parent_id   uuid references auth.users(id),

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz, -- when stage = 'steady_state'

  -- Funnel timing (seconds between stages — for OODA Observe loop)
  signup_to_consent_secs  integer,
  consent_to_age_secs     integer,
  age_to_role_secs        integer,
  role_to_name_secs       integer,
  name_to_identity_secs   integer,
  identity_to_activated_secs integer,

  constraint one_state_per_user unique (user_id)
);

-- Auto-update updated_at on any row change
create or replace function update_onboarding_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger onboarding_state_updated_at
  before update on public.user_onboarding_state
  for each row execute function update_onboarding_updated_at();

-- RLS: users can only read/write their own onboarding state
alter table public.user_onboarding_state enable row level security;

create policy "Users can view own onboarding state"
  on public.user_onboarding_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own onboarding state"
  on public.user_onboarding_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own onboarding state"
  on public.user_onboarding_state for update
  using (auth.uid() = user_id);

-- Founder/service-role can read all (for control room)
create policy "Service role can read all onboarding states"
  on public.user_onboarding_state for select
  using (auth.role() = 'service_role');

-- Indexes for control room funnel queries
create index idx_onboarding_stage on public.user_onboarding_state(stage);
create index idx_onboarding_role on public.user_onboarding_state(role);
create index idx_onboarding_created_at on public.user_onboarding_state(created_at desc);
create index idx_onboarding_activated_at on public.user_onboarding_state(activated_at desc) where activated_at is not null;

comment on table public.user_onboarding_state is
  'Tracks each user through the Se''kret Bip onboarding state machine. '
  'One row per user. Stage advances forward only. '
  'Funnel timing columns enable OODA loop analysis in the founder control room.';
