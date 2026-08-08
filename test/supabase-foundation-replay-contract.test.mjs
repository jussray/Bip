import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const founderFoundationPath = 'supabase/migrations/20240701000000_founder_audit_foundation.sql';
const firstControlRoomDependentPath = 'supabase/migrations/20240702_control_room_issues.sql';
const circleV1Path = 'supabase/migrations/20260616224106_0002_circle_v1.sql';
const safetyFoundationPath = 'supabase/migrations/20260617_safety_alert_foundation.sql';
const safetyScanPath = 'supabase/migrations/20260619_safety_scan.sql';
const safetyRemoteHistoryPath = 'supabase/migrations/20260622190209_remote_history.sql';

const founderFoundation = fs.readFileSync(new URL(`../${founderFoundationPath}`, import.meta.url), 'utf8');
const firstControlRoomDependent = fs.readFileSync(new URL(`../${firstControlRoomDependentPath}`, import.meta.url), 'utf8');
const circleV1 = fs.readFileSync(new URL(`../${circleV1Path}`, import.meta.url), 'utf8');
const safetyFoundation = fs.readFileSync(new URL(`../${safetyFoundationPath}`, import.meta.url), 'utf8');
const safetyScan = fs.readFileSync(new URL(`../${safetyScanPath}`, import.meta.url), 'utf8');
const safetyRemoteHistory = fs.readFileSync(new URL(`../${safetyRemoteHistoryPath}`, import.meta.url), 'utf8');

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

  assert.deepEqual(
    duplicates,
    [],
    `duplicate Supabase migration versions:\n${duplicates.join('\n')}`,
  );
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
  assert.match(
    founderFoundation,
    /grant select, insert, update, delete on table public\.audit_events to authenticated/i,
  );
  assert.doesNotMatch(founderFoundation, /journal|transcript|audio|raw_content|private_content/i);
});

test('Circle V1 remote-history migration contains the recovered schema body', () => {
  assert.doesNotMatch(circleV1, /^-- Migration already applied remotely\.[\s\S]*Compatibility placeholder/m);
  assert.match(circleV1, /Recovered from repository history \(commit a1f87d2c672fb6de6c602564d8e069a2a955d73e/);

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

test('captured remote history replaces same-name policies before recreating them', () => {
  for (const policy of [
    'oracle_sessions: owner read',
    'oracle_sessions: owner insert',
    'oracle_sessions: owner update',
    'oracle_sessions: owner delete',
    'parent_links: teen owner',
    'parent_links: parent read',
    'parent_links: parent accept',
    'parent_links: code lookup',
    'period_days: owner all',
    'safety_alerts: teen read',
    'safety_alerts: linked parent read',
    'safety_alerts: linked parent update reviewed',
  ]) {
    const escaped = policy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const drop = new RegExp(`drop policy if exists "${escaped}"`, 'i');
    const create = new RegExp(`create policy "${escaped}"`, 'i');
    assert.match(safetyRemoteHistory, drop, `remote history must drop ${policy} before recreate`);
    assert.match(safetyRemoteHistory, create, `remote history must recreate ${policy}`);
    assert.ok(
      safetyRemoteHistory.search(drop) < safetyRemoteHistory.search(create),
      `remote history must drop ${policy} before create`,
    );
  }
});

test('reconstructed foundations contain no runtime mutation or remote-repair command', () => {
  const combined = `${founderFoundation}\n${safetyFoundation}`;
  assert.doesNotMatch(combined, /migration\s+repair\s+--status/i);
  assert.doesNotMatch(combined, /supabase\s+db\s+push/i);
  assert.doesNotMatch(combined, /insert\s+into\s+public\.app_profiles/i);
  assert.doesNotMatch(combined, /insert\s+into\s+public\.audit_events/i);
  assert.doesNotMatch(combined, /insert\s+into\s+public\.safety_alerts/i);
});
