-- Se'kret Bip safety-alert verified-guardian authorization proof harness
-- Synthetic identities only. Every row is transaction-contained and rolled back.

begin;

create temp table safety_alert_context (
  label text primary key,
  user_id uuid not null
) on commit drop;

insert into safety_alert_context(label, user_id)
values
  ('teen', gen_random_uuid()),
  ('verified_parent', gen_random_uuid()),
  ('unverified_parent', gen_random_uuid()),
  ('stranger_parent', gen_random_uuid());

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
select
  null::uuid,
  user_id,
  'authenticated',
  'authenticated',
  label || '.safety-alert@sekret.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
from safety_alert_context;

insert into public.app_profiles (
  user_id,
  role,
  account_side,
  private_display_name,
  onboarding_complete,
  age_range,
  gender,
  selected_companion,
  parent_room_style,
  parent_focus
)
select
  user_id,
  case when label = 'teen' then 'teen' else 'parent' end,
  case when label = 'teen' then 'teen' else 'parent' end,
  'Synthetic ' || label,
  true,
  case when label = 'teen' then '16-17' else null end,
  case when label = 'teen' then 'other' else null end,
  case when label = 'teen' then 'cloud' else null end,
  case when label <> 'teen' then 'mom' else null end,
  case when label <> 'teen' then 'support' else null end
from safety_alert_context
on conflict (user_id) do update
set role = excluded.role,
    account_side = excluded.account_side,
    private_display_name = excluded.private_display_name,
    onboarding_complete = excluded.onboarding_complete,
    age_range = excluded.age_range,
    gender = excluded.gender,
    selected_companion = excluded.selected_companion,
    parent_room_style = excluded.parent_room_style,
    parent_focus = excluded.parent_focus;

insert into public.account_verification (
  user_id,
  verification_state,
  parent_link_state,
  verification_reason
)
select
  user_id,
  case when label = 'verified_parent' then 'VERIFIED_GUARDIAN' else 'UNVERIFIED' end,
  'none',
  'synthetic_safety_alert_probe'
from safety_alert_context
where label <> 'teen'
on conflict (user_id) do update
set verification_state = excluded.verification_state,
    parent_link_state = excluded.parent_link_state,
    verification_reason = excluded.verification_reason;

insert into public.parent_links (
  teen_user_id,
  parent_user_id,
  is_active,
  status,
  invite_code,
  expires_at,
  created_at,
  updated_at
)
values (
  (select user_id from safety_alert_context where label = 'teen'),
  (select user_id from safety_alert_context where label = 'unverified_parent'),
  true,
  'active',
  null,
  null,
  now(),
  now()
);

create temp table safety_alert_results (
  check_name text primary key,
  passed boolean not null,
  detail text not null
) on commit drop;

grant select on safety_alert_context to authenticated;
grant all on safety_alert_results to authenticated;

-- A teen must not be able to target a linked parent whose guardian identity
-- has not completed verification.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from safety_alert_context where label = 'teen'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_id::text from safety_alert_context where label = 'teen'),
    'role', 'authenticated',
    'is_anonymous', false
  )::text,
  true
);
set local role authenticated;
do $probe$
begin
  begin
    insert into public.safety_alerts (
      teen_user_id,
      parent_user_id,
      alert_type,
      severity,
      title,
      summary
    ) values (
      (select user_id from safety_alert_context where label = 'teen'),
      (select user_id from safety_alert_context where label = 'unverified_parent'),
      'moderation',
      'low',
      'Synthetic alert',
      'Synthetic proof only'
    );

    insert into safety_alert_results values (
      'unverified_linked_parent_target_denied',
      false,
      'Teen unexpectedly targeted an unverified linked parent'
    );
  exception when insufficient_privilege then
    insert into safety_alert_results values (
      'unverified_linked_parent_target_denied',
      true,
      'Unverified linked parent target denied'
    );
  end;
end
$probe$;
reset role;

-- A random parent UUID must not become authorized merely because the teen can
-- name it in an insert payload.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from safety_alert_context where label = 'teen'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_id::text from safety_alert_context where label = 'teen'),
    'role', 'authenticated',
    'is_anonymous', false
  )::text,
  true
);
set local role authenticated;
do $probe$
begin
  begin
    insert into public.safety_alerts (
      teen_user_id,
      parent_user_id,
      alert_type,
      severity,
      title,
      summary
    ) values (
      (select user_id from safety_alert_context where label = 'teen'),
      (select user_id from safety_alert_context where label = 'stranger_parent'),
      'moderation',
      'low',
      'Synthetic alert',
      'Synthetic proof only'
    );

    insert into safety_alert_results values (
      'unrelated_parent_target_denied',
      false,
      'Teen unexpectedly targeted an unrelated parent UUID'
    );
  exception when insufficient_privilege then
    insert into safety_alert_results values (
      'unrelated_parent_target_denied',
      true,
      'Unrelated parent target denied'
    );
  end;
end
$probe$;
reset role;

-- Replace the synthetic link with a fully verified guardian relationship.
update public.parent_links
set parent_user_id = (
      select user_id from safety_alert_context where label = 'verified_parent'
    ),
    status = 'active',
    is_active = true,
    updated_at = now()
where teen_user_id = (
  select user_id from safety_alert_context where label = 'teen'
);

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from safety_alert_context where label = 'teen'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_id::text from safety_alert_context where label = 'teen'),
    'role', 'authenticated',
    'is_anonymous', false
  )::text,
  true
);
set local role authenticated;
insert into public.safety_alerts (
  teen_user_id,
  parent_user_id,
  alert_type,
  severity,
  title,
  summary
) values (
  (select user_id from safety_alert_context where label = 'teen'),
  (select user_id from safety_alert_context where label = 'verified_parent'),
  'moderation',
  'low',
  'Synthetic verified alert',
  'Synthetic proof only'
);
reset role;

insert into safety_alert_results
select
  'verified_guardian_target_allowed',
  count(*) = 1,
  'Verified active guardian target accepted'
from public.safety_alerts
where teen_user_id = (
    select user_id from safety_alert_context where label = 'teen'
  )
  and parent_user_id = (
    select user_id from safety_alert_context where label = 'verified_parent'
  );

-- The verified guardian can read the row through RLS.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from safety_alert_context where label = 'verified_parent'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_id::text from safety_alert_context where label = 'verified_parent'),
    'role', 'authenticated',
    'is_anonymous', false
  )::text,
  true
);
set local role authenticated;
insert into safety_alert_results
select
  'verified_guardian_read_allowed',
  count(*) = 1,
  'Verified guardian can read the linked teen alert'
from public.safety_alerts
where teen_user_id = (
    select user_id from safety_alert_context where label = 'teen'
  )
  and parent_user_id = (
    select user_id from safety_alert_context where label = 'verified_parent'
  );
reset role;

-- Downgrading verification must revoke parent-side visibility immediately.
update public.account_verification
set verification_state = 'PENDING_GUARDIAN_REVIEW',
    verification_reason = 'synthetic_guardian_downgrade',
    verification_updated_at = now()
where user_id = (
  select user_id from safety_alert_context where label = 'verified_parent'
);

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from safety_alert_context where label = 'verified_parent'),
  true
);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_id::text from safety_alert_context where label = 'verified_parent'),
    'role', 'authenticated',
    'is_anonymous', false
  )::text,
  true
);
set local role authenticated;
insert into safety_alert_results
select
  'guardian_downgrade_revokes_read',
  count(*) = 0,
  'Parent-side visibility disappears when guardian verification is no longer valid'
from public.safety_alerts
where teen_user_id = (
    select user_id from safety_alert_context where label = 'teen'
  );
reset role;

select *
from safety_alert_results
order by check_name;

rollback;
