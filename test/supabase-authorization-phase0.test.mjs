import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const baselinePath = path.join(root, 'security', 'supabase-authorization-baseline.json');
const probePath = path.join(root, 'supabase', 'probes', 'authorization_phase0.sql');
const docPath = path.join(root, 'docs', 'security', 'SUPABASE_AUTHORIZATION_PHASE0.md');

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const probe = fs.readFileSync(probePath, 'utf8');
const doc = fs.readFileSync(docPath, 'utf8');

test('authorization baseline records the verified live migration and keeps L4 closed', () => {
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.project.ref, 'tbsevonvegdnlyjgplmm');
  assert.equal(baseline.project.latestLiveMigration.version, '20260713011803');
  assert.equal(baseline.project.latestLiveMigration.name, 'harden_config_table_grants');
  assert.equal(baseline.scope.productionDdlApplied, true);
  assert.equal(baseline.scope.productionDataRetained, false);
  assert.equal(baseline.releaseGate.l4SchemaAllowed, false);
});

test('all no-policy configuration and operational tables are explicitly service-role-only', () => {
  const byTable = new Map(
    baseline.advisorSnapshot.rlsEnabledNoPolicy.map((item) => [item.table, item]),
  );

  assert.equal(byTable.size, 4);
  assert.equal(byTable.get('guardian_verification_reviews').classification, 'service_role_only');
  assert.equal(byTable.get('notification_deliveries').classification, 'service_role_only');
  assert.equal(byTable.get('app_config').classification, 'service_role_only_after_grant_hardening');
  assert.equal(byTable.get('app_private_config').classification, 'service_role_only_after_grant_hardening');

  for (const item of byTable.values()) {
    assert.equal(item.rlsEnabled, true);
    assert.equal(item.policyCount, 0);
    assert.equal(item.anonHasTablePrivileges, false);
    assert.equal(item.authenticatedHasTablePrivileges, false);
    assert.equal(item.serviceRoleHasTablePrivileges, true);
  }
});

test('live config grant hardening preserves rows and removes all client grants', () => {
  const hardening = baseline.phase1ConfigGrantHardening;
  assert.equal(hardening.migrationVersion, '20260713011803');
  assert.equal(
    hardening.repositoryMigrationPath,
    'supabase/migrations/20260713011803_harden_config_table_grants.sql',
  );
  assert.equal(hardening.applied, true);
  assert.equal(hardening.verified, true);
  assert.equal(hardening.tables.length, 2);

  for (const table of hardening.tables) {
    assert.equal(table.rlsEnabled, true);
    assert.equal(table.policyCount, 0);
    assert.equal(table.clientGrantCount, 0);
    assert.equal(table.serviceRoleGrantCount, 7);
    assert.equal(table.rowCountBefore, 2);
    assert.equal(table.rowCountAfter, 2);
  }
});

test('SECURITY DEFINER inventory has no anonymous executable functions', () => {
  assert.equal(baseline.securityDefiner.totalReviewed, 35);
  assert.deepEqual(baseline.securityDefiner.anonExecutable, []);
  assert.equal(
    baseline.securityDefiner.authenticatedExecutableCount
      + baseline.securityDefiner.serviceRoleOnlyOrTriggerInternalCount,
    baseline.securityDefiner.totalReviewed,
  );
  assert.equal(
    baseline.securityDefiner.commonControlsObserved.some((value) => /search path/.test(value)),
    true,
  );
});

test('only two intentional custom-auth Edge Functions keep platform JWT verification disabled', () => {
  const functions = baseline.edgeFunctions.verifyJwtFalse;
  assert.equal(functions.length, 2);
  assert.deepEqual(
    functions.map((item) => item.slug).sort(),
    ['account-delete', 'safety-scan'],
  );

  for (const item of functions) {
    assert.equal(typeof item.classification, 'string');
    assert.equal(item.classification.length > 0, true);
    assert.equal(typeof item.control, 'string');
    assert.equal(item.control.length > 0, true);
  }
});

test('obsolete release and probe functions are live JWT-protected 410 retirements', () => {
  const retirements = baseline.edgeFunctions.jwtProtectedRetirements;
  assert.deepEqual(
    retirements.map((item) => item.slug).sort(),
    ['bridge-e2e-probe', 'github-workflow-status', 'release-health'],
  );

  const expectedVersions = new Map([
    ['release-health', 2],
    ['bridge-e2e-probe', 3],
    ['github-workflow-status', 4],
  ]);

  for (const item of retirements) {
    assert.equal(item.version, expectedVersions.get(item.slug));
    assert.equal(item.status, 'ACTIVE');
    assert.equal(item.verifyJwt, true);
    assert.equal(item.expectedAuthenticatedStatus, 410);
    assert.equal(item.sourceVerified, true);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.equal(typeof item.replacement, 'string');
    assert.equal(item.replacement.length > 0, true);
  }

  assert.equal(
    baseline.edgeFunctions.httpProbe.unauthenticated,
    'not_run_dns_unavailable_in_execution_environment',
  );
  assert.equal(
    baseline.edgeFunctions.httpProbe.authenticated,
    'not_run_no_safe_test_identity_available',
  );
});

test('live proof records four passed checks and zero synthetic residue', () => {
  assert.equal(baseline.liveProof.transactionOutcome, 'rolled_back');
  assert.equal(baseline.liveProof.checks.length, 4);
  assert.equal(baseline.liveProof.checks.every((check) => check.passed === true), true);
  assert.deepEqual(baseline.liveProof.cleanup, {
    phase0Users: 0,
    phase0Journals: 0,
    phase0Moods: 0,
    phase0VoiceNotes: 0,
  });
});

test('SQL probe is rollback-contained and exercises owner, cross-user, update, and anon denial', () => {
  assert.match(probe, /^-- Se'kret Bip Supabase authorization Phase 0 proof harness/m);
  assert.match(probe, /\bbegin;/i);
  assert.match(probe, /\brollback;\s*$/i);
  assert.doesNotMatch(probe, /\bcommit;/i);
  assert.match(probe, /set local role authenticated/i);
  assert.match(probe, /set local role anon/i);
  assert.match(probe, /authenticated_reads_own_private_rows/);
  assert.match(probe, /authenticated_denied_cross_user_reads/);
  assert.match(probe, /authenticated_denied_cross_user_update/);
  assert.match(probe, /anon_denied_private_rows/);
  assert.match(probe, /phase0@sekret\.invalid/);
});

test('authorization documentation refuses to certify all boundaries or activate L4', () => {
  assert.match(doc, /does not certify every table/i);
  assert.match(doc, /Begin L4 schema design only after/i);
  assert.match(doc, /zero synthetic users/i);
  assert.match(doc, /JWT-protected retirement/i);
  assert.match(doc, /Direct HTTP probing was not performed/i);
  assert.match(doc, /\| `app_config` \| enabled \| 0 \| 0 \| 7 \| 2 \| 2 \|/);
  assert.match(doc, /\| `app_private_config` \| enabled \| 0 \| 0 \| 7 \| 2 \| 2 \|/);
});

test('baseline contains no secret values or real email addresses', () => {
  const raw = fs.readFileSync(baselinePath, 'utf8');
  assert.doesNotMatch(raw, /service[_-]?role[_-]?key\s*[:=]/i);
  assert.doesNotMatch(raw, /openai[_-]?api[_-]?key\s*[:=]/i);
  assert.doesNotMatch(raw, /sk-[a-z0-9_-]{10,}/i);
  assert.doesNotMatch(raw, /@[a-z0-9.-]+\.(com|net|org|edu)\b/i);
});
