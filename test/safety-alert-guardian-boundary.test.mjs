import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationPath = path.join(
  root,
  'supabase',
  'migrations',
  '20260808220000_require_verified_guardian_for_safety_alerts.sql',
);
const probePath = path.join(
  root,
  'supabase',
  'probes',
  'authorization_safety_alert_guardian_phase1.sql',
);

const migration = fs.readFileSync(migrationPath, 'utf8');
const probe = fs.readFileSync(probePath, 'utf8');

test('verified guardian helper is caller-scoped and relationship-scoped', () => {
  assert.match(migration, /create or replace function public\.has_verified_guardian_link\(/i);
  assert.match(migration, /stable\s+security definer/i);
  assert.match(migration, /set search_path = public, auth/i);
  assert.match(migration, /auth\.uid\(\) = p_teen_user_id/i);
  assert.match(migration, /auth\.uid\(\) = p_parent_user_id/i);
  assert.match(migration, /pl\.teen_user_id = p_teen_user_id/i);
  assert.match(migration, /pl\.parent_user_id = p_parent_user_id/i);
  assert.match(migration, /pl\.status = 'active'/i);
  assert.match(migration, /pl\.is_active = true/i);
});

test('verified guardian helper requires the canonical parent identity state', () => {
  assert.match(migration, /join public\.app_profiles ap/i);
  assert.match(migration, /ap\.account_side = 'parent'/i);
  assert.match(migration, /ap\.onboarding_complete is true/i);
  assert.match(migration, /join public\.account_verification av/i);
  assert.match(migration, /av\.verification_state = 'VERIFIED_GUARDIAN'/i);
});

test('helper execution is not public or anonymous', () => {
  assert.match(
    migration,
    /revoke all on function public\.has_verified_guardian_link\(uuid, uuid\)[\s\S]*from public, anon;/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.has_verified_guardian_link\(uuid, uuid\)[\s\S]*to authenticated, service_role;/i,
  );
});

test('teen safety-alert insert cannot trust a client-supplied parent UUID', () => {
  const insertPolicy = migration.match(
    /alter policy "safety alerts insert teen only"[\s\S]*?\);/i,
  )?.[0] ?? '';

  assert.match(insertPolicy, /teen_user_id = auth\.uid\(\)/i);
  assert.match(
    insertPolicy,
    /public\.has_verified_guardian_link\(teen_user_id, parent_user_id\)/i,
  );
});

test('parent safety-alert reads require verified guardian relationship state', () => {
  const selectPolicy = migration.match(
    /alter policy "safety alerts select linked teen or parent"[\s\S]*?\);/i,
  )?.[0] ?? '';

  assert.match(selectPolicy, /teen_user_id = auth\.uid\(\)/i);
  assert.match(selectPolicy, /parent_user_id = auth\.uid\(\)/i);
  assert.match(
    selectPolicy,
    /public\.has_verified_guardian_link\(teen_user_id, parent_user_id\)/i,
  );
});

test('safety-alert updates cannot retarget a row outside a verified guardian link', () => {
  const updatePolicy = migration.match(
    /alter policy "safety alerts update parent or teen"[\s\S]*?;\s*\n\ncommit;/i,
  )?.[0] ?? '';

  assert.match(updatePolicy, /with check/i);
  assert.match(
    updatePolicy,
    /public\.has_verified_guardian_link\(teen_user_id, parent_user_id\)/i,
  );
  assert.match(updatePolicy, /teen_user_id = auth\.uid\(\)/i);
  assert.match(updatePolicy, /parent_user_id = auth\.uid\(\)/i);
});

test('adversarial SQL proof covers denied, allowed, and revoked guardian states', () => {
  for (const check of [
    'unverified_linked_parent_target_denied',
    'unrelated_parent_target_denied',
    'verified_guardian_target_allowed',
    'verified_guardian_read_allowed',
    'guardian_downgrade_revokes_read',
  ]) {
    assert.match(probe, new RegExp(check));
  }

  assert.match(probe, /exception when insufficient_privilege/gi);
  assert.match(probe, /PENDING_GUARDIAN_REVIEW/i);
  assert.match(probe, /VERIFIED_GUARDIAN/i);
});

test('SQL proof is synthetic and rollback-contained', () => {
  assert.match(probe, /^-- Se'kret Bip safety-alert verified-guardian authorization proof harness/m);
  assert.match(probe, /\bbegin;/i);
  assert.match(probe, /\brollback;\s*$/i);
  assert.doesNotMatch(probe, /\bcommit;/i);
  assert.match(probe, /@sekret\.invalid/i);
  assert.doesNotMatch(probe, /@[a-z0-9.-]+\.(com|net|org|edu)\b/i);
});

test('migration is transactional and narrowly scoped to safety alerts', () => {
  assert.match(migration, /^begin;/im);
  assert.match(migration, /commit;\s*$/i);
  assert.match(migration, /on public\.safety_alerts/gi);
  assert.doesNotMatch(migration, /alter policy .*journal_entries/i);
  assert.doesNotMatch(migration, /alter policy .*mood_history/i);
  assert.doesNotMatch(migration, /alter policy .*bridge_signals/i);
  assert.doesNotMatch(migration, /alter policy .*parent_notes/i);
});
