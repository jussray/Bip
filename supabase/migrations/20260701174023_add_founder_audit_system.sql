create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','teen','parent','moderator','developer','admin','founder')),
  can_view_audits boolean not null default false,
  can_manage_app boolean not null default false,
  exclude_from_analytics boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  screen text,
  severity text not null default 'info' check (severity in ('info','warning','error','critical')),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_at_idx on public.audit_events (created_at desc);
create index if not exists audit_events_severity_idx on public.audit_events (severity, resolved, created_at desc);
create index if not exists audit_events_event_type_idx on public.audit_events (event_type, created_at desc);

alter table public.app_profiles enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists app_profiles_select_own on public.app_profiles;
create policy app_profiles_select_own
on public.app_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists app_profiles_update_own_limited on public.app_profiles;
create policy app_profiles_update_own_limited
on public.app_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists audit_events_insert_authenticated on public.audit_events;
create policy audit_events_insert_authenticated
on public.audit_events
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists audit_events_select_founder on public.audit_events;
create policy audit_events_select_founder
on public.audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.app_profiles p
    where p.user_id = auth.uid()
      and p.can_view_audits = true
      and p.role in ('developer','admin','founder')
  )
);

drop policy if exists audit_events_update_founder on public.audit_events;
create policy audit_events_update_founder
on public.audit_events
for update
to authenticated
using (
  exists (
    select 1
    from public.app_profiles p
    where p.user_id = auth.uid()
      and p.can_manage_app = true
      and p.role in ('admin','founder')
  )
)
with check (
  exists (
    select 1
    from public.app_profiles p
    where p.user_id = auth.uid()
      and p.can_manage_app = true
      and p.role in ('admin','founder')
  )
);

drop policy if exists audit_events_delete_founder on public.audit_events;
create policy audit_events_delete_founder
on public.audit_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_profiles p
    where p.user_id = auth.uid()
      and p.can_manage_app = true
      and p.role = 'founder'
  )
);

-- Production history included an account-specific founder bootstrap here.
-- It is intentionally omitted from repository replay so fresh environments
-- do not publish or hard-code an individual account identifier.
