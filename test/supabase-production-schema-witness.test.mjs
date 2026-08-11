import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildReadOnlyQuery,
  deriveRepositorySchemaVersion,
  evaluateSchemaRow,
  extractRows,
  verifySupabaseProductionSchema,
} from '../scripts/verify-supabase-production-schema.mjs';

const CURRENT_MAIN_SCHEMA_HEAD = '20260811132800';
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

function migrationDir(names) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-migrations-'));
  for (const name of names) fs.writeFileSync(path.join(root, name), '-- fixture\n', 'utf8');
  return root;
}

test('repository schema head derives from the newest canonical 14-digit migration', async () => {
  const dir = migrationDir([
    '0001_init.sql',
    '20260614_sekret_reply.sql',
    '20260811132500_extend_onboarding_stage_enum.sql',
    '20260811132800_align_first_mood_trigger_search_path.sql',
  ]);

  assert.equal(await deriveRepositorySchemaVersion(dir), CURRENT_MAIN_SCHEMA_HEAD);
});

test('repository schema head automatically advances when a newer migration is added', async () => {
  const dir = migrationDir([
    '20260811132800_align_first_mood_trigger_search_path.sql',
    '20260811134000_harden_circle_friendships_write_path.sql',
  ]);

  assert.equal(await deriveRepositorySchemaVersion(dir), '20260811134000');
});

test('repository schema derivation fails closed without a canonical migration', async () => {
  const dir = migrationDir(['0001_init.sql', '20260614_sekret_reply.sql']);
  await assert.rejects(
    deriveRepositorySchemaVersion(dir),
    /No canonical 14-digit Supabase migration/,
  );
});

test('read-only witness queries only live migration history', () => {
  const query = buildReadOnlyQuery();
  assert.match(query, /max\(version\)/i);
  assert.match(query, /from supabase_migrations\.schema_migrations/i);
  assert.doesNotMatch(query, /\b(insert|update|delete|alter|drop|create|grant|revoke)\b/i);
});

test('row normalization accepts Management API response wrappers', () => {
  const row = { live_max_version: CURRENT_MAIN_SCHEMA_HEAD };
  assert.deepEqual(extractRows([row]), [row]);
  assert.deepEqual(extractRows({ result: [row] }), [row]);
  assert.deepEqual(extractRows({ data: [row] }), [row]);
  assert.deepEqual(extractRows({ rows: [row] }), [row]);
});

test('schema witness requires exact equality between repo and live migration heads', () => {
  assert.equal(evaluateSchemaRow({
    live_max_version: CURRENT_MAIN_SCHEMA_HEAD,
  }, CURRENT_MAIN_SCHEMA_HEAD).verified, true);

  assert.equal(evaluateSchemaRow({
    live_max_version: '20260808222306',
  }, CURRENT_MAIN_SCHEMA_HEAD).verified, false);

  assert.equal(evaluateSchemaRow({
    live_max_version: '20260811134000',
  }, CURRENT_MAIN_SCHEMA_HEAD).verified, false);
});

test('production verifier derives repo head, uses read-only Management API, and writes redacted evidence', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-supabase-schema-'));
  const migrationsDir = path.join(tmp, 'migrations');
  const evidencePath = path.join(tmp, 'evidence.json');
  fs.mkdirSync(migrationsDir);
  fs.writeFileSync(
    path.join(migrationsDir, `${CURRENT_MAIN_SCHEMA_HEAD}_latest.sql`),
    '-- fixture\n',
    'utf8',
  );

  let observedUrl = '';
  let observedOptions = null;
  const evidence = await verifySupabaseProductionSchema({
    config: {
      token: 'secret-token-for-test',
      projectRef: 'tbsevonvegdnlyjgplmm',
      migrationsDir,
      evidencePath,
    },
    fetchImpl: async (url, options) => {
      observedUrl = url;
      observedOptions = options;
      return fakeResponse({ body: [{ live_max_version: CURRENT_MAIN_SCHEMA_HEAD }] });
    },
  });

  assert.equal(evidence.verified, true);
  assert.equal(evidence.expectedVersion, CURRENT_MAIN_SCHEMA_HEAD);
  assert.equal(evidence.liveMaxVersion, CURRENT_MAIN_SCHEMA_HEAD);
  assert.match(observedUrl, /\/database\/query\/read-only$/);
  assert.equal(observedOptions.method, 'POST');
  assert.match(observedOptions.headers.Authorization, /^Bearer /);
  assert.match(observedOptions.body, /supabase_migrations\.schema_migrations/);

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.doesNotMatch(retained, /secret-token-for-test/);
  assert.match(retained, /"verified": true/);
});

test('production verifier fails closed when live Supabase is behind and retains non-secret evidence', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-supabase-schema-drift-'));
  const migrationsDir = path.join(tmp, 'migrations');
  const evidencePath = path.join(tmp, 'evidence.json');
  fs.mkdirSync(migrationsDir);
  fs.writeFileSync(
    path.join(migrationsDir, `${CURRENT_MAIN_SCHEMA_HEAD}_latest.sql`),
    '-- fixture\n',
    'utf8',
  );

  await assert.rejects(
    verifySupabaseProductionSchema({
      config: {
        token: 'secret-token-for-test',
        projectRef: 'tbsevonvegdnlyjgplmm',
        migrationsDir,
        evidencePath,
      },
      fetchImpl: async () => fakeResponse({ body: [{ live_max_version: '20260808222306' }] }),
    }),
    /SUPABASE_PRODUCTION_SCHEMA_DRIFT: repo_head=20260811132800, live_head=20260808222306/,
  );

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.doesNotMatch(retained, /secret-token-for-test/);
  assert.match(retained, /"verified": false/);
});

test('Cloudflare release workflow treats every migration change as production truth', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /supabase\/migrations\/\*\*/);
  assert.match(workflow, /id: supabase_schema/);
  assert.match(workflow, /verify-supabase-production-schema\.mjs/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.match(workflow, /artifacts\/supabase-production-schema\.json/);
  assert.doesNotMatch(workflow, /EXPECTED_SUPABASE_SCHEMA_VERSION/);
});
