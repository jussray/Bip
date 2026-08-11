import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  DEFAULT_SCHEMA_VERSION,
  buildReadOnlyQuery,
  evaluateSchemaRow,
  extractRows,
  verifySupabaseProductionSchema,
} from '../scripts/verify-supabase-production-schema.mjs';

const migrationPath = 'supabase/migrations/20260811132900_register_production_schema_contract.sql';
const workflowPath = '.github/workflows/deploy-cloudflare.yml';

function fakeResponse({ ok = true, status = 201, body = [] } = {}) {
  return {
    ok,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

test('production schema marker migration records the canonical contract version', () => {
  const migration = fs.readFileSync(migrationPath, 'utf8');
  assert.match(migration, /contract_key, version, applied_at/i);
  assert.match(migration, /'production_schema'\s*,\s*'20260811132900'/i);
  assert.match(migration, /on conflict \(contract_key\) do update/i);
});

test('read-only witness queries only qualified production contract sources', () => {
  const query = buildReadOnlyQuery(DEFAULT_SCHEMA_VERSION);
  assert.match(query, /from supabase_migrations\.schema_migrations/i);
  assert.match(query, /from public\.runtime_contract_versions/i);
  assert.match(query, /contract_key = 'production_schema'/i);
  assert.match(query, /20260811132900/);
  assert.doesNotMatch(query, /\b(insert|update|delete|alter|drop|create|grant|revoke)\b/i);
});

test('row normalization accepts Management API response wrappers', () => {
  const row = { migration_applied: true, contract_version: DEFAULT_SCHEMA_VERSION };
  assert.deepEqual(extractRows([row]), [row]);
  assert.deepEqual(extractRows({ result: [row] }), [row]);
  assert.deepEqual(extractRows({ data: [row] }), [row]);
  assert.deepEqual(extractRows({ rows: [row] }), [row]);
});

test('schema witness requires both migration history and contract marker', () => {
  assert.equal(evaluateSchemaRow({
    migration_applied: true,
    contract_version: DEFAULT_SCHEMA_VERSION,
  }, DEFAULT_SCHEMA_VERSION).verified, true);

  assert.equal(evaluateSchemaRow({
    migration_applied: false,
    contract_version: DEFAULT_SCHEMA_VERSION,
  }, DEFAULT_SCHEMA_VERSION).verified, false);

  assert.equal(evaluateSchemaRow({
    migration_applied: true,
    contract_version: '20260811132800',
  }, DEFAULT_SCHEMA_VERSION).verified, false);
});

test('production verifier uses Supabase read-only Management API and writes redacted evidence', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-supabase-schema-'));
  const evidencePath = path.join(tmp, 'evidence.json');
  let observedUrl = '';
  let observedOptions = null;

  const evidence = await verifySupabaseProductionSchema({
    config: {
      token: 'secret-token-for-test',
      projectRef: 'tbsevonvegdnlyjgplmm',
      expectedVersion: DEFAULT_SCHEMA_VERSION,
      evidencePath,
    },
    fetchImpl: async (url, options) => {
      observedUrl = url;
      observedOptions = options;
      return fakeResponse({
        body: [{ migration_applied: true, contract_version: DEFAULT_SCHEMA_VERSION }],
      });
    },
  });

  assert.equal(evidence.verified, true);
  assert.match(observedUrl, /\/database\/query\/read-only$/);
  assert.equal(observedOptions.method, 'POST');
  assert.match(observedOptions.headers.Authorization, /^Bearer /);
  assert.match(observedOptions.body, /supabase_migrations\.schema_migrations/);

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.doesNotMatch(retained, /secret-token-for-test/);
  assert.match(retained, /"verified": true/);
});

test('production verifier fails closed on schema drift and retains non-secret evidence', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-supabase-schema-drift-'));
  const evidencePath = path.join(tmp, 'evidence.json');

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'secret-token-for-test',
        projectRef: 'tbsevonvegdnlyjgplmm',
        expectedVersion: DEFAULT_SCHEMA_VERSION,
        evidencePath,
      },
      fetchImpl: async () => fakeResponse({
        body: [{ migration_applied: false, contract_version: '' }],
      }),
    }),
    /SUPABASE_PRODUCTION_SCHEMA_DRIFT/,
  );

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.doesNotMatch(retained, /secret-token-for-test/);
  assert.match(retained, /"verified": false/);
});

test('Cloudflare release workflow treats Supabase schema as a production witness', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /supabase\/migrations\/\*\*/);
  assert.match(workflow, /id: supabase_schema/);
  assert.match(workflow, /verify-supabase-production-schema\.mjs/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.match(workflow, /artifacts\/supabase-production-schema\.json/);
});
