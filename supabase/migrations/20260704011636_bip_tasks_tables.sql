create table if not exists public.bip_tasks (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_by_role text not null check (created_by_role in ('teen','parent','system')),
  title text not null check (length(trim(title)) > 0),
  description text,
  category text not null default 'custom' check (category in ('home','school','self_care','growth','habit','custom')),
  point_value integer not null default 0 check (point_value between 0 and 10000),
  requires_approval boolean not null default true,
  due_at timestamptz,
  recurrence_rule text,
  status text not null default 'active' check (status in ('active','submitted','rejected','completed','cancelled','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bip_tasks_teen_status_idx on public.bip_tasks(teen_id, status, created_at desc);
create index if not exists bip_tasks_creator_idx on public.bip_tasks(created_by, created_at desc);
alter table public.bip_tasks enable row level security;

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.bip_tasks(id) on delete cascade,
  teen_id uuid not null references auth.users(id) on delete cascade,
  note text,
  evidence_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text
);

create unique index if not exists task_submissions_one_open_idx on public.task_submissions(task_id) where status = 'pending';
create index if not exists task_submissions_teen_idx on public.task_submissions(teen_id, submitted_at desc);
alter table public.task_submissions enable row level security;
