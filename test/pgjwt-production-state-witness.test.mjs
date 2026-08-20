import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildReadOnlyQuery,
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

function fakeResponse(pgjwtInstalled) {
  return {
    ok: true,
    status: 201,
    async text() {
      return JSON.stringify([{
        live_max_version: '20260820214601',
        migration_history: [{
          version: '20260820214601',
          name: 'drop_deprecated_pgjwt',
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

test('applied drop receipt cannot fake green while pgjwt is installed', async () => {
  const { migrationsDir, evidencePath } = fixture();

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'test-token',
        projectRef: 'tbsevonvegdnlyjgplmm',
        migrationsDir,
        evidencePath,
      },
      fetchImpl: async () => fakeResponse(true),
    }),
    /SUPABASE_DEPRECATED_EXTENSION_PRESENT/,
  );

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.match(retained, /"pgjwtInstalled": true/);
  assert.match(retained, /"verified": false/);
  assert.match(retained, /"status": "deprecated-extension-present"/);
});

test('same receipt verifies when pgjwt is actually absent', async () => {
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
