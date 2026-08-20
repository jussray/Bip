import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildReadOnlyQuery,
  PGJWT_FOUNDER_OVERRIDE_STATUS,
  verifySupabaseProductionSchema,
} from '../scripts/verify-supabase-production-schema.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-pgjwt-state-'));
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

function fakeResponse(pgjwtInstalled, migrationName = 'drop_deprecated_pgjwt') {
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
        pgjwt_installed: pgjwtInstalled,
      }]);
    },
  };
}

test('production witness reads live pgjwt extension state', () => {
  const query = buildReadOnlyQuery();
  assert.match(query, /pg_extension/i);
  assert.match(query, /extname\s*=\s*'pgjwt'/i);
  assert.match(query, /pgjwt_installed/i);
  assert.match(query, /supabase_migrations\.schema_migrations/i);
});

test('founder-approved pgjwt installation remains visible without failing clean schema history', async () => {
  const { migrationsDir, evidencePath } = fixture();

  const evidence = await verifySupabaseProductionSchema({
    config: {
      token: 'test-token',
      projectRef: 'tbsevonvegdnlyjgplmm',
      migrationsDir,
      evidencePath,
    },
    fetchImpl: async () => fakeResponse(true),
  });

  assert.equal(evidence.verified, true);
  assert.equal(evidence.pgjwtInstalled, true);
  assert.equal(evidence.status, PGJWT_FOUNDER_OVERRIDE_STATUS);

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.match(retained, /"pgjwtInstalled": true/);
  assert.match(retained, /"verified": true/);
  assert.match(retained, /"status": "verified-with-founder-extension-override"/);
});

test('founder pgjwt override cannot hide migration-history drift', async () => {
  const { migrationsDir, evidencePath } = fixture();

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'test-token',
        projectRef: 'tbsevonvegdnlyjgplmm',
        migrationsDir,
        evidencePath,
      },
      fetchImpl: async () => fakeResponse(true, 'different_migration'),
    }),
    /SUPABASE_PRODUCTION_SCHEMA_DRIFT/,
  );

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.match(retained, /"pgjwtInstalled": true/);
  assert.match(retained, /"verified": false/);
  assert.match(retained, /"status": "schema-drift"/);
});

test('same receipt verifies normally when pgjwt is absent', async () => {
  const { migrationsDir, evidencePath } = fixture();

  const evidence = await verifySupabaseProductionSchema({
    config: {
      token: 'test-token',
      projectRef: 'tbsevonvegdnlyjgplmm',
      migrationsDir,
      evidencePath,
    },
    fetchImpl: async () => fakeResponse(false),
  });

  assert.equal(evidence.verified, true);
  assert.equal(evidence.pgjwtInstalled, false);
  assert.equal(evidence.status, 'verified');
});
