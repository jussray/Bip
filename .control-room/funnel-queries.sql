-- ============================================================
-- Se'kret Bip — Onboarding Funnel Queries
-- OODA Observe Layer / Founder Control Room
-- ============================================================
-- Run these on founder-control-room or directly on Se'kret Bip
-- (service role only — RLS enforced on the production table).
-- ============================================================


-- ── 1. FUNNEL OVERVIEW ───────────────────────────────────────
-- Count of users at each stage, broken out by role.
-- Primary top-of-funnel health check.

select
  stage,
  role,
  count(*)                                       as users,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as pct_of_total
from public.user_onboarding_state
group by stage, role
order by
  array_position(array[
    'pre_signup','signed_up','consent_complete','age_verified',
    'role_selected','name_set','identity_set','reflection_complete',
    'parent_link_sent','parent_linked','parent_link_skipped',
    'parent_setup_complete','activated','steady_state'
  ]::text[], stage::text),
  role;


-- ── 2. STEP-BY-STEP DROP-OFF (TEEN PATH) ────────────────────
-- Shows users who reached each step vs previous step.
-- Identify the biggest leak in the teen funnel.

with stages as (
  select unnest(array[
    'signed_up','consent_complete','age_verified',
    'name_set','identity_set','reflection_complete','activated'
  ]::onboarding_stage[]) as stage,
  generate_series(1,7) as ord
),
counts as (
  select stage, count(*) as n
  from public.user_onboarding_state
  where role = 'teen' or role = 'unknown'
  group by stage
)
select
  s.ord,
  s.stage,
  coalesce(c.n, 0)                                      as users_at_stage,
  lag(coalesce(c.n, 0)) over (order by s.ord)           as prev_stage_users,
  round(
    100.0 * coalesce(c.n, 0)
    / nullif(lag(coalesce(c.n, 0)) over (order by s.ord), 0),
    1
  )                                                     as retention_pct
from stages s
left join counts c using (stage)
order by s.ord;


-- ── 3. STEP-BY-STEP DROP-OFF (PARENT PATH) ──────────────────

with stages as (
  select unnest(array[
    'signed_up','consent_complete',
    'parent_setup_complete','activated'
  ]::onboarding_stage[]) as stage,
  generate_series(1,4) as ord
),
counts as (
  select stage, count(*) as n
  from public.user_onboarding_state
  where role = 'parent'
  group by stage
)
select
  s.ord,
  s.stage,
  coalesce(c.n, 0)                                      as users_at_stage,
  lag(coalesce(c.n, 0)) over (order by s.ord)           as prev_stage_users,
  round(
    100.0 * coalesce(c.n, 0)
    / nullif(lag(coalesce(c.n, 0)) over (order by s.ord), 0),
    1
  )                                                     as retention_pct
from stages s
left join counts c using (stage)
order by s.ord;


-- ── 4. AVERAGE FUNNEL TIMING ─────────────────────────────────
-- Median + p90 seconds between key stage transitions.
-- Use to find where users are slow / confused.

select
  'signup → consent'    as transition,
  percentile_cont(0.5) within group (order by signup_to_consent_secs)  as median_secs,
  percentile_cont(0.9) within group (order by signup_to_consent_secs)  as p90_secs,
  count(*) filter (where signup_to_consent_secs is not null)            as sample_n
from public.user_onboarding_state
union all
select
  'consent → age',
  percentile_cont(0.5) within group (order by consent_to_age_secs),
  percentile_cont(0.9) within group (order by consent_to_age_secs),
  count(*) filter (where consent_to_age_secs is not null)
from public.user_onboarding_state
union all
select
  'age → role',
  percentile_cont(0.5) within group (order by age_to_role_secs),
  percentile_cont(0.9) within group (order by age_to_role_secs),
  count(*) filter (where age_to_role_secs is not null)
from public.user_onboarding_state
union all
select
  'name → identity',
  percentile_cont(0.5) within group (order by name_to_identity_secs),
  percentile_cont(0.9) within group (order by name_to_identity_secs),
  count(*) filter (where name_to_identity_secs is not null)
from public.user_onboarding_state
union all
select
  'identity → activated',
  percentile_cont(0.5) within group (order by identity_to_activated_secs),
  percentile_cont(0.9) within group (order by identity_to_activated_secs),
  count(*) filter (where identity_to_activated_secs is not null)
from public.user_onboarding_state
order by transition;


-- ── 5. ACTIVATION BREAKDOWN ──────────────────────────────────
-- What action is converting users to 'activated'?
-- Use to understand which feature is the true activation event.

select
  activation_action,
  role,
  count(*)                                                       as activated_users,
  round(avg(identity_to_activated_secs) / 60.0, 1)              as avg_mins_to_activate,
  round(100.0 * count(*) / sum(count(*)) over (partition by role), 1) as pct_of_role
from public.user_onboarding_state
where stage in ('activated', 'steady_state')
group by activation_action, role
order by role, activated_users desc;


-- ── 6. PARENT LINK RATE ───────────────────────────────────────
-- Of parents who reached parent_setup_complete,
-- what % linked a teen vs skipped?

select
  count(*) filter (where stage = 'parent_linked')       as linked,
  count(*) filter (where stage = 'parent_link_skipped') as skipped,
  count(*) filter (where stage = 'parent_setup_complete') as setup_but_not_linked,
  round(
    100.0
    * count(*) filter (where stage = 'parent_linked')
    / nullif(
        count(*) filter (where stage in ('parent_linked','parent_link_skipped','parent_setup_complete')),
        0
      ),
    1
  ) as link_rate_pct
from public.user_onboarding_state
where role = 'parent';


-- ── 7. AGE BUCKET DISTRIBUTION ───────────────────────────────
-- Teen age range mix. Informs content + safety decisions.

select
  coalesce(age_bucket, 'unknown') as age_bucket,
  count(*)                         as users,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
from public.user_onboarding_state
where role in ('teen', 'unknown')
group by age_bucket
order by users desc;


-- ── 8. DAILY SIGNUPS + ACTIVATION RATE (LAST 30 DAYS) ───────
-- Trending acquisition and activation. Run weekly.

select
  date_trunc('day', created_at) at time zone 'America/New_York' as day,
  count(*)                                                        as signups,
  count(*) filter (where stage in ('activated','steady_state'))  as activated,
  round(
    100.0
    * count(*) filter (where stage in ('activated','steady_state'))
    / nullif(count(*), 0),
    1
  ) as activation_rate_pct
from public.user_onboarding_state
where created_at >= now() - interval '30 days'
group by 1
order by 1 desc;


-- ── 9. STUCK USERS (>24h, NOT ACTIVATED) ─────────────────────
-- Users who started onboarding but haven't activated.
-- Candidate list for re-engagement push / email.

select
  user_id,
  stage,
  role,
  age_bucket,
  device_platform,
  created_at,
  now() - created_at as time_stuck
from public.user_onboarding_state
where
  stage not in ('activated', 'steady_state')
  and created_at < now() - interval '24 hours'
order by created_at asc
limit 100;


-- ── 10. PLATFORM SPLIT ───────────────────────────────────────

select
  coalesce(device_platform, 'unknown') as platform,
  count(*)                              as users,
  count(*) filter (where stage in ('activated','steady_state')) as activated
from public.user_onboarding_state
group by platform
order by users desc;
