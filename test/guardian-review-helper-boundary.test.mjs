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
  '20260713060000_restrict_guardian_review_helper_execute.sql',
);
const probePath = path.join(
  root,
  'supabase',
  'probes',
  'authorization_guardian_helper_execute_phase1.sql',
);
const panelPath = path.join(
  root,
  'src',
  'features',
  'control-room',
  'GuardianReviewsPanel.tsx',
);

const migration = fs.readFileSync(migrationPath, 'utf8');
const probe = fs.readFileSync(probePath, 'utf8');
const panel = fs.readFileSync(panelPath, 'utf8');

test('guardian authorization helper is no longer a direct authenticated RPC', () => {
  assert.match(
    migration,
    /revoke all on function public\.can_manage_guardian_reviews\(\)\s+from public, anon, authenticated;/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.can_manage_guardian_reviews\(\)\s+to service_role;/i,
  );
  assert.doesNotMatch(
    migration,
    /grant execute on function public\.can_manage_guardian_reviews\(\)[^;]*authenticated/i,
  );
});

test('founder UI uses reviewed queue and decision wrappers, not the internal helper', () => {
  assert.match(panel, /rpc\('list_guardian_verification_queue'\)/);
  assert.match(panel, /rpc\('review_guardian_verification'/);
  assert.doesNotMatch(panel, /rpc\('can_manage_guardian_reviews'\)/);
});

test('guardian helper proof is rollback-contained and retains no user or app rows', () => {
  assert.match(probe, /^-- Se'kret Bip guardian helper execution Phase 1 proof harness/m);
  assert.match(probe, /\bbegin;/i);
  assert.match(probe, /\brollback;\s*$/i);
  assert.doesNotMatch(probe, /\bcommit;/i);
  assert.doesNotMatch(probe, /insert\s+into\s+auth\.users/i);
  assert.doesNotMatch(probe, /insert\s+into\s+public\./i);
  assert.doesNotMatch(probe, /@[a-z0-9.-]+\.(com|net|org|edu)\b/i);
});

test('guardian helper proof covers direct denial and wrapper continuity', () => {
  for (const check of [
    'normal_direct_helper_denied',
    'normal_queue_rpc_denied',
    'normal_review_rpc_denied',
    'founder_direct_helper_denied',
    'founder_queue_rpc_allowed',
    'founder_review_reaches_target_validation',
    'guardian_helper_grants_are_least_privilege',
  ]) {
    assert.match(probe, new RegExp(check));
  }

  assert.match(probe, /exception when insufficient_privilege/i);
  assert.match(probe, /exception when invalid_parameter_value/i);
  assert.match(
    probe,
    /has_function_privilege\('service_role', 'public\.can_manage_guardian_reviews\(\)', 'EXECUTE'\)/i,
  );
});

test('migration documents why the helper remains executable internally', () => {
  assert.match(migration, /internal authorization predicate/i);
  assert.match(migration, /postgres-owned SECURITY DEFINER context/i);
  assert.match(migration, /^begin;/im);
  assert.match(migration, /commit;\s*$/i);
});
