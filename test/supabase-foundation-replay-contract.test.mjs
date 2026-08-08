import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const founderFoundationPath = 'supabase/migrations/20240701000000_founder_audit_foundation.sql';
const firstControlRoomDependentPath = 'supabase/migrations/20240702_control_room_issues.sql';
const circleV1Path = 'supabase/migrations/0002_circle_v1.sql';
const phase3Path = 'supabase/migrations/0003_oracle_parentlinks_period_safety.sql';
const safetyScanPath = 'supabase/migrations/20260619_safety_scan.sql';

const founderFoundation = fs.readFileSync(new URL(`../${founderFoundationPath}`, import.meta.url), 'utf8');
const firstControlRoomDependent = fs.readFileSync(new URL(`../${firstControlRoomDependentPath}`, import.meta.url), 'utf8');
const circleV1 = fs.readFileSync(new URL(`../${circleV1Path}`, import.meta.url), 'utf8');
const phase3 = fs.readFileSync(new URL(`../${phase3Path}`, import.meta.url), 'utf8');
const safetyScan = fs.readFileSync(new URL(`../${safetyScanPath}`, import.meta.url), 'utf8');

function migrationInventory() {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(testDir, '../supabase/migrations');
  return fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

test('every active migration has a unique Supabase version prefix', () => {
  const byVersion = new Map();
  for (const name of migrationInventory()) {
    const [version] = name.split('_', 1);
    if (!/^\d+$/.test(version)) continue;
    const names = byVersion.get(version) ?? [];
    names.push(name);
    byVersion.set(version, names);
  }

  const duplicates = [...byVersion.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([version, names]) => `${version}: ${names.join(', ')}`);

  assert.deepEqual(duplicates, [], `duplicate Supabase migration versions:\n${duplicates.join('\n')}`);
});

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
  assert.doesNotMatch(founderFoundation, /journal|transcript|audio|raw_content|private_content/i);
});

test('canonical Circle V1 migration contains the recovered schema body', () => {
  for (const table of [
    'circle_profiles',
    'circle_friend_requests',
    'circle_friendships',
    'crew_memberships',
    'public_circle_posts',
    'friends_circle_posts',
    'crew_circle_posts',
    'circle_comments',
    'circle_reactions',
    'blocked_users',
    'reported_posts',
  ]) {
    assert.match(circleV1, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }
  assert.match(circleV1, /alter table public\.public_circle_posts enable row level security/i);
  assert.match(circleV1, /create policy "pcp_insert" on public\.public_circle_posts/i);
  assert.match(circleV1, /create policy "pcp_delete" on public\.public_circle_posts/i);
});

test('canonical Phase 3 migration creates safety prerequisites before hardening', () => {
  assert.ok(phase3Path.localeCompare(safetyScanPath) < 0, `${phase3Path} must sort before ${safetyScanPath}`);
  for (const table of ['oracle_sessions', 'parent_links', 'safety_alerts']) {
    assert.match(phase3, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }
  assert.match(phase3, /alter table public\.safety_alerts enable row level security/i);
  assert.match(phase3, /create policy "safety_alerts: teen read"/i);
  assert.match(phase3, /create policy "safety_alerts: linked parent read"/i);
  assert.match(safetyScan, /alter table public\.safety_alerts/i);
});

test('replay foundations contain no remote mutation or migration-history repair command', () => {
  const combined = `${founderFoundation}\n${circleV1}\n${phase3}`;
  assert.doesNotMatch(combined, /migration\s+repair\s+--status/i);
  assert.doesNotMatch(combined, /supabase\s+db\s+push/i);
});
