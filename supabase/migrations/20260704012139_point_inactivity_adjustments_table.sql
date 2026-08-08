create table if not exists public.point_inactivity_adjustments (
  user_id uuid not null references auth.users(id) on delete cascade,
  adjustment_date date not null default current_date,
  days_away integer not null check (days_away >= 0),
  points_adjusted integer not null check (points_adjusted >= 0),
  reason text not null default 'return_nudge',
  created_at timestamptz not null default now(),
  primary key (user_id, adjustment_date)
);

alter table public.point_inactivity_adjustments enable row level security;

create policy point_inactivity_adjustments_owner_read
on public.point_inactivity_adjustments
for select
to authenticated
using (auth.uid() = user_id);
