import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const foundationPath = 'supabase/migrations/20240701000000_founder_audit_foundation.sql';
const firstDependentPath = 'supabase/migrations/20240702_control_room_issues.sql';
const foundation = fs.readFileSync(new URL(`../${foundationPath}`, import.meta.url), 'utf8');
const firstDependent = fs.readFileSync(new URL(`../${firstDependentPath}`, import.meta.url), 'utf8');

test('restored foundation sorts before the first tracked Control Room dependency', () => {
  assert.ok(
    foundationPath.localeCompare(firstDependentPath) < 0,
    `${foundationPath} must sort before ${firstDependentPath}`,
  );
  assert.match(firstDependent, /from\s+public\.app_profiles/i);
  assert.match(firstDependent, /alter table public\.audit_events/i);
});

test('app_profiles foundation is minimal and non-founder by default', () => {
  for (const column of [
    'user_id uuid primary key',
    'email text',
    'role text',
    'can_view_audits boolean not null default false',
    'can_manage_app boolean not null default false',
    'exclude_from_analytics boolean not null default false',
    'created_at timestamptz not null default now()',
    'updated_at timestamptz not null default now()',
  ]) {
    assert.ok(foundation.includes(column), `missing app_profiles foundation column: ${column}`);
  }

  assert.match(foundation, /alter table public\.app_profiles enable row level security/i);
  assert.match(foundation, /revoke all privileges on table public\.app_profiles from anon/i);
  assert.match(foundation, /grant select on table public\.app_profiles to authenticated/i);
  assert.doesNotMatch(foundation, /grant\s+(insert|update|delete)[\s\S]*app_profiles\s+to\s+authenticated/i);
  assert.doesNotMatch(foundation, /role\s+text[^,\n]*default\s+'(?:founder|admin|developer)'/i);
});

test('audit_events foundation is metadata-only and RLS-gated', () => {
  for (const column of [
    'id uuid primary key default gen_random_uuid()',
    'user_id uuid references auth.users(id) on delete set null',
    'event_type text not null',
    'screen text',
    "severity text not null default 'info'",
    'message text',
    "metadata jsonb not null default '{}'::jsonb",
    'resolved boolean not null default false',
    'created_at timestamptz not null default now()',
  ]) {
    assert.ok(foundation.includes(column), `missing audit_events foundation column: ${column}`);
  }

  assert.match(foundation, /alter table public\.audit_events enable row level security/i);
  assert.match(foundation, /revoke all privileges on table public\.audit_events from anon/i);
  assert.match(
    foundation,
    /grant select, insert, update, delete on table public\.audit_events to authenticated/i,
  );
  assert.doesNotMatch(foundation, /journal|transcript|audio|raw_content|private_content/i);
});

test('foundation contains no runtime mutation or remote-repair command', () => {
  assert.doesNotMatch(foundation, /migration\s+repair\s+--status/i);
  assert.doesNotMatch(foundation, /supabase\s+db\s+push/i);
  assert.doesNotMatch(foundation, /insert\s+into\s+public\.app_profiles/i);
  assert.doesNotMatch(foundation, /insert\s+into\s+public\.audit_events/i);
});
