import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const founderFoundationPath = 'supabase/migrations/20240701000000_founder_audit_foundation.sql';
const firstControlRoomDependentPath = 'supabase/migrations/20240702_control_room_issues.sql';
const safetyFoundationPath = 'supabase/migrations/20260617_safety_alert_foundation.sql';
const safetyScanPath = 'supabase/migrations/20260619_safety_scan.sql';
const safetyRemoteHistoryPath = 'supabase/migrations/20260622190209_remote_history.sql';

const founderFoundation = fs.readFileSync(new URL(`../${founderFoundationPath}`, import.meta.url), 'utf8');
const firstControlRoomDependent = fs.readFileSync(new URL(`../${firstControlRoomDependentPath}`, import.meta.url), 'utf8');
const safetyFoundation = fs.readFileSync(new URL(`../${safetyFoundationPath}`, import.meta.url), 'utf8');
const safetyScan = fs.readFileSync(new URL(`../${safetyScanPath}`, import.meta.url), 'utf8');
const safetyRemoteHistory = fs.readFileSync(new URL(`../${safetyRemoteHistoryPath}`, import.meta.url), 'utf8');

test('restored founder foundation sorts before the first tracked Control Room dependency', () => {
  assert.ok(
    founderFoundationPath.localeCompare(firstControlRoomDependentPath) < 0,
    `${founderFoundationPath} must sort before ${firstControlRoomDependentPath}`,
  );
  assert.match(firstControlRoomDependent, /from\s+public\.app_profiles/i);
  assert.match(firstControlRoomDependent, /alter table public\.audit_events/i);
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
    assert.ok(founderFoundation.includes(column), `missing app_profiles foundation column: ${column}`);
  }

  assert.match(founderFoundation, /alter table public\.app_profiles enable row level security/i);
  assert.match(founderFoundation, /revoke all privileges on table public\.app_profiles from anon/i);
  assert.match(founderFoundation, /grant select on table public\.app_profiles to authenticated/i);
  assert.doesNotMatch(founderFoundation, /grant\s+(insert|update|delete)[\s\S]*app_profiles\s+to\s+authenticated/i);
  assert.doesNotMatch(founderFoundation, /role\s+text[^,\n]*default\s+'(?:founder|admin|developer)'/i);
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
    assert.ok(founderFoundation.includes(column), `missing audit_events foundation column: ${column}`);
  }

  assert.match(founderFoundation, /alter table public\.audit_events enable row level security/i);
  assert.match(founderFoundation, /revoke all privileges on table public\.audit_events from anon/i);
  assert.match(
    founderFoundation,
    /grant select, insert, update, delete on table public\.audit_events to authenticated/i,
  );
  assert.doesNotMatch(founderFoundation, /journal|transcript|audio|raw_content|private_content/i);
});

test('safety alert foundation sorts before the hardening migration and matches recorded remote history', () => {
  assert.ok(
    safetyFoundationPath.localeCompare(safetyScanPath) < 0,
    `${safetyFoundationPath} must sort before ${safetyScanPath}`,
  );
  assert.match(safetyScan, /alter table public\.safety_alerts/i);
  assert.match(safetyScan, /Depends on:.*0003_oracle_parentlinks_period_safety\.sql/i);

  for (const column of [
    'id bigserial primary key',
    'user_id uuid not null references auth.users(id) on delete cascade',
    'alert_type text not null',
    'content_preview text',
    'source_table text',
    'source_id text',
    "severity text not null default 'low'",
    'reviewed_by_parent boolean not null default false',
    'parent_notified_at timestamptz',
    'created_at timestamptz not null default now()',
  ]) {
    assert.ok(safetyFoundation.includes(column), `missing safety_alerts foundation column: ${column}`);
    assert.ok(safetyRemoteHistory.toLowerCase().includes(column), `remote history does not record safety_alerts column: ${column}`);
  }

  assert.match(safetyFoundation, /alter table public\.safety_alerts enable row level security/i);
  assert.match(safetyFoundation, /revoke all privileges on table public\.safety_alerts from anon, authenticated/i);
  assert.doesNotMatch(safetyFoundation, /create policy/i);
});

test('reconstructed foundations contain no runtime mutation or remote-repair command', () => {
  const combined = `${founderFoundation}\n${safetyFoundation}`;
  assert.doesNotMatch(combined, /migration\s+repair\s+--status/i);
  assert.doesNotMatch(combined, /supabase\s+db\s+push/i);
  assert.doesNotMatch(combined, /insert\s+into\s+public\.app_profiles/i);
  assert.doesNotMatch(combined, /insert\s+into\s+public\.audit_events/i);
  assert.doesNotMatch(combined, /insert\s+into\s+public\.safety_alerts/i);
});
