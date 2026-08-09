import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const circleV1Path = 'supabase/migrations/0002_circle_v1.sql';
const phase3Path = 'supabase/migrations/0003_oracle_parentlinks_period_safety.sql';
const safetyScanPath = 'supabase/migrations/20260619_safety_scan.sql';
const parentInvitePath = 'supabase/migrations/20260628235058_add_parent_link_invites.sql';
const nonAnonymousGuardPath = 'supabase/migrations/20260629024952_block_anonymous_sessions_from_private_data.sql';
const verificationCreatePath = 'supabase/migrations/20260630000131_create_account_verification.sql';
const verificationHardenPath = 'supabase/migrations/20260630004333_harden_account_verification_access.sql';
const parentTransitionPath = 'supabase/migrations/20260630022018_limited_mode_parent_invite_transition.sql';
const founderAuditPath = 'supabase/migrations/20260701174023_add_founder_audit_system.sql';
const founderHardenPath = 'supabase/migrations/20260701174034_harden_founder_profile_permissions.sql';
const founderIdeasPath = 'supabase/migrations/20260701224958_sync_founder_ideas_table.sql';
const controlRoomPath = 'supabase/migrations/20260701225042_sync_control_room_issues_table.sql';
const runtimeLoggerPath = 'supabase/migrations/20260701225212_sync_runtime_logger_rpc.sql';
const safetyReconcilePath = 'supabase/migrations/20260808221720_reconcile_safety_alert_runtime_schema.sql';
const safetyGrantPath = 'supabase/migrations/20260808222306_lock_safety_alert_table_grants.sql';
const legacyPointsRetirementPath = 'supabase/migrations/20260809002000_retire_legacy_activity_event_points.sql';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const circleV1 = read(circleV1Path);
const phase3 = read(phase3Path);
const safetyScan = read(safetyScanPath);
const parentInvite = read(parentInvitePath);
const nonAnonymousGuard = read(nonAnonymousGuardPath);
const verificationCreate = read(verificationCreatePath);
const verificationHarden = read(verificationHardenPath);
const parentTransition = read(parentTransitionPath);
const founderAudit = read(founderAuditPath);
const founderHarden = read(founderHardenPath);
const founderIdeas = read(founderIdeasPath);
const controlRoom = read(controlRoomPath);
const runtimeLogger = read(runtimeLoggerPath);
const safetyReconcile = read(safetyReconcilePath);
const safetyGrant = read(safetyGrantPath);
const legacyPointsRetirement = read(legacyPointsRetirementPath);

function migrationInventory() {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(testDir, '../supabase/migrations');
  return fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
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

test('stale synthetic, local-only, and compressed migration history is not active', () => {
  const active = new Set(migrationInventory());
  for (const stale of [
    '0004_supplemental_tables.sql',
    '20240701000000_founder_audit_foundation.sql',
    '20240701_founder_ideas.sql',
    '20240702_control_room_issues.sql',
    '20260616224106_0002_circle_v1.sql',
    '20260627_bip_events.sql',
    '20260627_point_ledger.sql',
    '20260629032000_complete_parent_bridge_safety_storage_rls.sql',
    '20260630001000_account_verification_parent_approval.sql',
    '20260630002000_limited_mode_parent_invite.sql',
    '20260630003000_reconcile_parent_link_contract.sql',
    '20260701_control_room_normalization.sql',
    '20260701_runtime_logger_rpc.sql',
    '20260703_reconcile_point_ledger_schema.sql',
    '20260704_fix_task_rpc_event_column.sql',
    '20260704_restrict_public_feed_posts_to_permanent_users.sql',
    '20260704_sync_points_chores_rewards.sql',
    '20260705010000_bridge_summary_contract.sql',
    '20260705010000_crew_accountability.sql',
    '20260808222500_reconcile_safety_alert_runtime_schema.sql',
    '20260808223500_lock_safety_alert_table_grants.sql',
  ]) {
    assert.equal(active.has(stale), false, `${stale} must stay out of active migration history`);
  }
});

test('canonical 0002 carries V1 feeds plus the verified pre-ledger Circle V2 foundation', () => {
  for (const table of [
    'circle_profiles', 'circle_friend_requests', 'circle_friendships', 'crew_memberships',
    'public_circle_posts', 'friends_circle_posts', 'crew_circle_posts', 'circle_comments',
    'circle_reactions', 'blocked_users', 'reported_posts',
  ]) {
    assert.match(circleV1, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }

  assert.match(circleV1, /create type public\.circle_kind as enum \('public','friends','crew','parent'\)/i);
  assert.match(circleV1, /create type public\.reaction_kind as enum \('hug','heart','listen','support','spark'\)/i);
  assert.match(circleV1, /create type public\.mood_level as enum \('very_low','low','okay','good','great'\)/i);

  for (const table of ['crews', 'parent_links', 'circles', 'circle_members', 'posts', 'post_comments', 'post_reactions', 'moods', 'parent_mood_summaries']) {
    assert.match(circleV1, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }

  for (const shape of [
    /create table if not exists public\.circles \([\s\S]*?id uuid primary key/i,
    /kind public\.circle_kind not null/i,
    /create table if not exists public\.circle_members \([\s\S]*?id uuid primary key/i,
    /circle_id uuid not null references public\.circles\(id\)/i,
    /create table if not exists public\.posts \([\s\S]*?id uuid primary key/i,
    /create table if not exists public\.post_reactions \([\s\S]*?id uuid primary key/i,
    /reaction public\.reaction_kind not null/i,
    /create table if not exists public\.moods \([\s\S]*?id uuid primary key/i,
    /mood public\.mood_level not null/i,
    /create table if not exists public\.parent_mood_summaries \([\s\S]*?id uuid primary key/i,
  ]) {
    assert.match(circleV1, shape);
  }

  assert.match(circleV1, /constraint parent_links_one_parent_per_teen unique \(teen_user_id\)/i);
  assert.match(circleV1, /constraint circles_kind_shape check/i);
  assert.match(circleV1, /create policy "circles select owner or member"/i);
  assert.match(circleV1, /create policy "circles insert own"/i);
  assert.match(circleV1, /create policy "posts select by circle visibility"/i);
  assert.match(circleV1, /create policy "posts insert by author"/i);

  assert.doesNotMatch(circleV1, /create table if not exists public\.circles \([\s\S]*?id\s+bigserial/i);
  assert.doesNotMatch(circleV1, /create table if not exists public\.posts \([\s\S]*?id\s+bigserial/i);
  assert.doesNotMatch(circleV1, /create table if not exists public\.moods \([\s\S]*?\bslug\s+text/i);
});

test('canonical Phase 3 replay carries verified parent-link and safety compatibility unions', () => {
  assert.ok(phase3Path.localeCompare(safetyScanPath) < 0, `${phase3Path} must sort before ${safetyScanPath}`);
  for (const table of ['oracle_sessions', 'parent_links', 'safety_alerts']) {
    assert.match(phase3, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }

  for (const column of [
    'is_active boolean NOT NULL DEFAULT true',
    'quiet_hours_start time',
    'quiet_hours_end time',
    'invite_code text UNIQUE',
    'expires_at timestamptz',
    'updated_at timestamptz NOT NULL DEFAULT now()',
  ]) {
    assert.ok(phase3.includes(column), `missing verified pre-ledger parent_links column: ${column}`);
  }
  assert.doesNotMatch(phase3, /invite_code text NOT NULL/i);
  assert.doesNotMatch(phase3, /expires_at timestamptz NOT NULL/i);

  assert.match(phase3, /create table if not exists public\.safety_alerts \([\s\S]*?id uuid primary key/i);
  for (const column of [
    'teen_user_id uuid', 'parent_user_id uuid', 'source_mood_id uuid', 'source_post_id uuid',
    'user_id uuid', 'source_table text', 'source_id text', 'reviewed_by_parent boolean',
    'parent_notified_at timestamptz', 'title text', 'summary text', 'is_read boolean',
  ]) {
    assert.match(phase3, new RegExp(column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.match(phase3, /constraint safety_alerts_alert_type_check/i);
  assert.match(phase3, /constraint safety_alerts_severity_check/i);
  assert.match(phase3, /check \(alert_type in \('critical_mood','self_harm_keyword','panic_pattern','manual_sos'\)\)/i);
  assert.match(phase3, /check \(severity in \('medium','high','critical'\)\)/i);
  assert.match(phase3, /alter table public\.safety_alerts enable row level security/i);
  assert.match(safetyScan, /alter table public\.safety_alerts/i);
});

test('canonical parent-link and account-verification sequence replaces local compressed drafts', () => {
  assert.ok(phase3Path.localeCompare(parentInvitePath) < 0);
  assert.ok(parentInvitePath.localeCompare(nonAnonymousGuardPath) < 0);
  assert.ok(nonAnonymousGuardPath.localeCompare(verificationCreatePath) < 0);
  assert.ok(verificationCreatePath.localeCompare(verificationHardenPath) < 0);
  assert.ok(verificationHardenPath.localeCompare(parentTransitionPath) < 0);

  assert.match(parentInvite, /parent_links_status_check/i);
  assert.match(parentInvite, /parent_links_invite_code_unique/i);
  assert.match(verificationCreate, /create table if not exists public\.account_verification/i);
  assert.match(verificationCreate, /create or replace function public\.initialize_account_verification\(\)/i);
  assert.match(verificationHarden, /revoke execute on function public\.initialize_account_verification\(\)/i);
  assert.match(parentTransition, /create or replace function public\.create_parent_link_invite\(\)/i);
  assert.match(parentTransition, /returns table\([\s\S]*activated_at timestamptz/i);
});

test('canonical non-anonymous session guard is fail-closed before account verification hardening', () => {
  assert.ok(nonAnonymousGuardPath.localeCompare(verificationHardenPath) < 0);
  assert.match(nonAnonymousGuard, /create or replace function public\.is_non_anonymous_user\(\)/i);
  assert.match(nonAnonymousGuard, /returns boolean/i);
  assert.match(nonAnonymousGuard, /language sql/i);
  assert.match(nonAnonymousGuard, /\bstable\b/i);
  assert.match(nonAnonymousGuard, /set search_path = public, pg_temp/i);
  assert.match(nonAnonymousGuard, /auth\.jwt\(\)\s*->>\s*'is_anonymous'/i);
  assert.match(nonAnonymousGuard, /revoke all on function public\.is_non_anonymous_user\(\) from public, anon/i);
  assert.match(nonAnonymousGuard, /grant execute on function public\.is_non_anonymous_user\(\) to authenticated, service_role/i);
});

test('canonical July 1 founder and Control Room history is ordered and fail-closed', () => {
  assert.ok(founderAuditPath.localeCompare(founderHardenPath) < 0);
  assert.ok(founderHardenPath.localeCompare(founderIdeasPath) < 0);
  assert.ok(founderIdeasPath.localeCompare(controlRoomPath) < 0);
  assert.ok(controlRoomPath.localeCompare(runtimeLoggerPath) < 0);

  assert.match(founderAudit, /create table if not exists public\.app_profiles/i);
  assert.match(founderAudit, /role text not null default 'user'/i);
  assert.match(founderAudit, /create table if not exists public\.audit_events/i);
  assert.match(founderAudit, /alter table public\.app_profiles enable row level security/i);
  assert.match(founderAudit, /alter table public\.audit_events enable row level security/i);
  assert.doesNotMatch(founderAudit, /where\s+lower\(email\)/i);
  assert.doesNotMatch(founderAudit, /@/);

  assert.match(founderHarden, /revoke update, insert, delete on public\.app_profiles from authenticated/i);
  assert.match(founderIdeas, /create table if not exists public\.founder_ideas/i);
  assert.match(controlRoom, /create table if not exists public\.control_room_issues/i);
  assert.match(runtimeLogger, /create or replace function public\.log_control_room_runtime_event/i);
});

test('canonical Aug safety reconciliation preserves legacy fields and locks clients to read-only', () => {
  assert.ok(safetyReconcilePath.localeCompare(safetyGrantPath) < 0);
  for (const column of ['user_id', 'source_table', 'source_id', 'reviewed_by_parent', 'parent_notified_at']) {
    assert.match(safetyReconcile, new RegExp(`add column if not exists ${column}\\b`, 'i'));
  }
  assert.match(safetyReconcile, /set user_id = teen_user_id/i);
  assert.match(safetyReconcile, /alter column user_id set not null/i);
  assert.match(safetyReconcile, /alter column teen_user_id drop not null/i);
  assert.doesNotMatch(safetyReconcile, /drop column/i);
  assert.match(safetyGrant, /revoke all on table public\.safety_alerts from authenticated/i);
  assert.match(safetyGrant, /grant select on table public\.safety_alerts to authenticated/i);
});

test('fresh canonical replay retires the legacy activity-events point trigger without dropping ledger data', () => {
  assert.match(legacyPointsRetirement, /drop trigger if exists activity_events_award_points on public\.activity_events/i);
  assert.match(legacyPointsRetirement, /drop function if exists public\.award_points_for_app_activity\(\)/i);
  assert.doesNotMatch(legacyPointsRetirement, /drop table/i);
  assert.doesNotMatch(legacyPointsRetirement, /delete from/i);
});

test('replay migration sources contain no remote mutation or history-repair command', () => {
  const combined = [
    circleV1, phase3, parentInvite, nonAnonymousGuard, verificationCreate,
    verificationHarden, parentTransition, founderAudit, founderHarden,
    founderIdeas, controlRoom, runtimeLogger, safetyReconcile, safetyGrant,
    legacyPointsRetirement,
  ].join('\n');
  assert.doesNotMatch(combined, /migration\s+repair\s+--status/i);
  assert.doesNotMatch(combined, /supabase\s+db\s+push/i);
});
