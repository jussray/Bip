create table if not exists public.control_room_fingerprints (
  fingerprint text primary key,
  source text not null default 'runtime',
  category text not null default 'runtime',
  default_severity text not null default 'error',
  title_template text not null,
  summary_template text,
  suggested_fix text,
  affected_surface text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
