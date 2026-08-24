import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  PRODUCTION_PGJWT_POLICY,
  buildReadOnlyQuery,
  evaluatePgjwtPolicy,
  verifySupabaseProductionSchema,
} from '../scripts/verify-supabase-production-schema.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-pgjwt-policy-'));
  const migrationsDir = path.join(root, 'migrations');
  const evidencePath = path.join(root, 'evidence.json');
  fs.mkdirSync(migrationsDir);
  fs.writeFileSync(
    path.join(migrationsDir, '20260820211200_drop_deprecated_pgjwt.sql'),
    '-- fixture\n',
    'utf8',
  );
  return { migrationsDir, evidencePath };
}

function fakeResponse({
  installed,
  version,
  migrationName = 'drop_deprecated_pgjwt',
}) {
  return {
    ok: true,
    status: 201,
    async text() {
      return JSON.stringify([{
        live_max_version: '20260820214601',
        migration_history: [{
          version: '20260820214601',
          name: migrationName,
        }],
        pgjwt_installed: installed,
        pgjwt_version: version,
      }]);
    },
  };
}

test('production policy requires deprecated pgjwt to remain absent', () => {
  assert.deepEqual(PRODUCTION_PGJWT_POLICY, {
    installed: false,
    version: null,
    authority: 'repository-migration',
    decision: 'drop',
    boundTo: 'supabase/migrations/20260820211200_drop_deprecated_pgjwt.sql',
  });
});

test('production witness reads pgjwt presence and exact version without mutation', () => {
  const query = buildReadOnlyQuery();
  assert.match(query, /pg_extension/i);
  assert.match(query, /extname\s*=\s*'pgjwt'/i);
  assert.match(query, /pgjwt_installed/i);
  assert.match(query, /pgjwt_version/i);
  assert.match(query, /extversion/i);
  assert.doesNotMatch(query, /\b(insert|update|delete|alter|drop|create|grant|revoke)\b/i);
});

test('intentional pgjwt absence after the deprecation migration verifies green', async () => {
  const { migrationsDir, evidencePath } = fixture();
  const evidence = await verifySupabaseProductionSchema({
    config: {
      token: 'test-token',
      projectRef: 'tbsevonvegdnlyjgplmm',
      migrationsDir,
      evidencePath,
    },
    requirePgjwtState: true,
    fetchImpl: async () => fakeResponse({ installed: false, version: null }),
  });

  assert.equal(evidence.verified, true);
  assert.equal(evidence.status, 'verified');
  assert.equal(evidence.pgjwtObserved, true);
  assert.equal(evidence.pgjwtInstalled, false);
  assert.equal(evidence.pgjwtVersion, null);
});

test('unexpected pgjwt installation fails closed against current policy', async () => {
  const { migrationsDir, evidencePath } = fixture();

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'test-token',
        projectRef: 'tbsevonvegdnlyjgplmm',
        migrationsDir,
        evidencePath,
      },
      requirePgjwtState: true,
      fetchImpl: async () => fakeResponse({ installed: true, version: '0.2.0' }),
    }),
    /SUPABASE_EXTENSION_POLICY_DRIFT/,
  );
});

test('unexpected pgjwt version also fails closed against current policy', async () => {
  const { migrationsDir, evidencePath } = fixture();

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'test-token',
        projectRef: 'tbsevonvegdnlyjgplmm',
        migrationsDir,
        evidencePath,
      },
      requirePgjwtState: true,
      fetchImpl: async () => fakeResponse({ installed: true, version: '9.9.9' }),
    }),
    /SUPABASE_EXTENSION_POLICY_DRIFT/,
  );
});

test('pgjwt policy cannot hide migration-history drift', async () => {
  const { migrationsDir, evidencePath } = fixture();

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'test-token',
        projectRef: 'tbsevonvegdnlyjgplmm',
        migrationsDir,
        evidencePath,
      },
      requirePgjwtState: true,
      fetchImpl: async () => fakeResponse({
        installed: false,
        version: null,
        migrationName: 'different_migration',
      }),
    }),
    /SUPABASE_PRODUCTION_SCHEMA_DRIFT/,
  );

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.match(retained, /"verified": false/);
  assert.match(retained, /"status": "schema-drift"/);
});

test('missing live pgjwt observation is not policy proof', () => {
  const evaluated = evaluatePgjwtPolicy({}, { allowInjectedFallback: false });
  assert.equal(evaluated.observed, false);
  assert.equal(evaluated.verified, false);
});
