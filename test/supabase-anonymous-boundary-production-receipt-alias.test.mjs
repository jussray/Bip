import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRODUCTION_HISTORY_ALL_ACCEPTED_ALIASES,
  PRODUCTION_HISTORY_APPLIED_ALIASES,
  PRODUCTION_HISTORY_RUNTIME_ALIASES,
  PRODUCTION_PGJWT_POLICY,
  evaluateMigrationHistory,
  evaluatePgjwtPolicy,
} from '../scripts/verify-supabase-production-schema.mjs';

const ANON_CANONICAL_VERSION = '20260821071500';
const ANON_LIVE_VERSION = '20260821073219';
const ANON_MIGRATION_NAME = 'harden_anonymous_permanent_account_boundaries';
const TC01_CANONICAL_VERSION = '20260822060000';
const TC01_LIVE_VERSION = '20260824004706';
const TC01_MIGRATION_NAME = 'tc01_private_safety_boundary';

test('anonymous-boundary production apply receipt remains an explicit exact alias', () => {
  assert.equal(
    PRODUCTION_HISTORY_APPLIED_ALIASES[ANON_CANONICAL_VERSION],
    ANON_LIVE_VERSION,
  );
  assert.equal(
    PRODUCTION_HISTORY_ALL_ACCEPTED_ALIASES[ANON_CANONICAL_VERSION],
    ANON_LIVE_VERSION,
  );
});

test('anonymous-boundary live receipt represents the matching canonical migration', () => {
  const evaluated = evaluateMigrationHistory(
    {
      live_max_version: ANON_LIVE_VERSION,
      migration_history: [{ version: ANON_LIVE_VERSION, name: ANON_MIGRATION_NAME }],
    },
    [{ version: ANON_CANONICAL_VERSION, name: ANON_MIGRATION_NAME }],
  );

  assert.equal(evaluated.verified, true);
  assert.deepEqual(evaluated.representedCanonicalVersions, [ANON_CANONICAL_VERSION]);
  assert.deepEqual(evaluated.acceptedAliasVersions, [{
    canonicalVersion: ANON_CANONICAL_VERSION,
    liveVersion: ANON_LIVE_VERSION,
    name: ANON_MIGRATION_NAME,
  }]);
  assert.deepEqual(evaluated.missingCanonicalVersions, []);
  assert.deepEqual(evaluated.unexpectedRecentVersions, []);
});

test('anonymous-boundary alias fails closed when the receipt name differs', () => {
  const evaluated = evaluateMigrationHistory(
    {
      live_max_version: ANON_LIVE_VERSION,
      migration_history: [{ version: ANON_LIVE_VERSION, name: 'different_migration' }],
    },
    [{ version: ANON_CANONICAL_VERSION, name: ANON_MIGRATION_NAME }],
  );

  assert.equal(evaluated.verified, false);
  assert.deepEqual(evaluated.missingCanonicalVersions, [ANON_CANONICAL_VERSION]);
  assert.deepEqual(evaluated.unexpectedRecentVersions, [{
    liveVersion: ANON_LIVE_VERSION,
    name: 'different_migration',
  }]);
});

test('TC-01 production apply receipt is an explicit runtime alias', () => {
  assert.equal(
    PRODUCTION_HISTORY_RUNTIME_ALIASES[TC01_CANONICAL_VERSION],
    TC01_LIVE_VERSION,
  );
});

test('TC-01 live receipt represents only the matching canonical migration', () => {
  const evaluated = evaluateMigrationHistory(
    {
      live_max_version: TC01_LIVE_VERSION,
      migration_history: [{ version: TC01_LIVE_VERSION, name: TC01_MIGRATION_NAME }],
    },
    [{ version: TC01_CANONICAL_VERSION, name: TC01_MIGRATION_NAME }],
    undefined,
    PRODUCTION_HISTORY_RUNTIME_ALIASES,
  );

  assert.equal(evaluated.verified, true);
  assert.deepEqual(evaluated.representedCanonicalVersions, [TC01_CANONICAL_VERSION]);
  assert.deepEqual(evaluated.acceptedAliasVersions, [{
    canonicalVersion: TC01_CANONICAL_VERSION,
    liveVersion: TC01_LIVE_VERSION,
    name: TC01_MIGRATION_NAME,
  }]);
  assert.deepEqual(evaluated.missingCanonicalVersions, []);
  assert.deepEqual(evaluated.unexpectedRecentVersions, []);
});

test('TC-01 alias fails closed when the receipt name differs', () => {
  const evaluated = evaluateMigrationHistory(
    {
      live_max_version: TC01_LIVE_VERSION,
      migration_history: [{ version: TC01_LIVE_VERSION, name: 'different_migration' }],
    },
    [{ version: TC01_CANONICAL_VERSION, name: TC01_MIGRATION_NAME }],
    undefined,
    PRODUCTION_HISTORY_RUNTIME_ALIASES,
  );

  assert.equal(evaluated.verified, false);
  assert.deepEqual(evaluated.missingCanonicalVersions, [TC01_CANONICAL_VERSION]);
  assert.deepEqual(evaluated.unexpectedRecentVersions, [{
    liveVersion: TC01_LIVE_VERSION,
    name: 'different_migration',
  }]);
});

test('production pgjwt policy matches the merged deprecation migration', () => {
  assert.deepEqual(PRODUCTION_PGJWT_POLICY, {
    installed: false,
    version: null,
    authority: 'repository-migration',
    decision: 'drop',
    boundTo: 'supabase/migrations/20260820211200_drop_deprecated_pgjwt.sql',
  });
  assert.equal(evaluatePgjwtPolicy({ pgjwt_installed: false, pgjwt_version: null }).verified, true);
  assert.equal(evaluatePgjwtPolicy({ pgjwt_installed: true, pgjwt_version: '0.2.0' }).verified, false);
});
