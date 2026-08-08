create table if not exists public.founder_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'backlog',
  category text,
  priority integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
