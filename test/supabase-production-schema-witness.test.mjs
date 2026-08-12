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

test('Cloudflare release workflow validates a trusted current-main target before checkout or Production secret use', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflow, /supabase\/migrations\/\*\*/);
  assert.match(workflow, /verify-native-deployment:\n(?:.|\n)*?environment: Production/);
  assert.match(workflow, /name: Validate trusted release target before checkout/);
  assert.match(workflow, /commits\/main/);
  assert.match(workflow, /Refusing to expose Production-scoped secrets to a target that is not current main/);
  assert.match(workflow, /id: supabase_schema/);
  assert.match(workflow, /verify-supabase-production-schema\.mjs/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.match(workflow, /artifacts\/supabase-production-schema\.json/);
  assert.doesNotMatch(workflow, /EXPECTED_SUPABASE_SCHEMA_VERSION/);

  const trustedTargetIndex = workflow.indexOf('name: Validate trusted release target before checkout');
  const checkoutIndex = workflow.indexOf('name: Check out release commit under verification');
  const schemaWitnessIndex = workflow.indexOf('id: supabase_schema');
  const cloudflareReleaseIndex = workflow.indexOf('id: cloudflare_release');
  assert.notEqual(trustedTargetIndex, -1, 'Trusted-target validation must exist');
  assert.notEqual(checkoutIndex, -1, 'Release checkout must exist');
  assert.notEqual(schemaWitnessIndex, -1, 'Supabase schema witness must exist');
  assert.notEqual(cloudflareReleaseIndex, -1, 'Cloudflare exact-release witness must exist');
  assert.ok(
    trustedTargetIndex < checkoutIndex,
    'Current-main trust must be established before target-controlled code is checked out',
  );
  assert.ok(
    checkoutIndex < schemaWitnessIndex,
    'The Supabase token must only reach code after trusted-target validation and checkout',
  );
  assert.ok(
    schemaWitnessIndex < cloudflareReleaseIndex,
    'Supabase schema drift must fail before the long Cloudflare exact-release wait',
  );
});

test('blocked release receipts use trusted current-main publisher code even when target validation fails before checkout', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /trusted_publisher="\$RUNNER_TEMP\/sekret-publish-production-release-observation\.mjs"/);
  assert.match(workflow, /Accept: application\/vnd\.github\.raw\+json/);
  assert.match(workflow, /contents\/scripts\/publish-production-release-observation\.mjs\?ref=\$current_main/);
  assert.match(workflow, /test -s "\$trusted_publisher"/);
  assert.match(workflow, /Publish blocked exact production observation[\s\S]*node "\$RUNNER_TEMP\/sekret-publish-production-release-observation\.mjs"/);

  const currentMainIndex = workflow.indexOf('current_main="$({');
  const trustedPublisherIndex = workflow.indexOf('trusted_publisher="$RUNNER_TEMP/sekret-publish-production-release-observation.mjs"');
  const targetFormatIndex = workflow.indexOf('[[ "$TARGET_SHA" =~ ^[0-9a-fA-F]{40}$ ]]');
  const checkoutIndex = workflow.indexOf('name: Check out release commit under verification');
  const blockerIndex = workflow.indexOf('name: Publish blocked exact production observation');
  const trustedBlockerRunIndex = workflow.indexOf('node "$RUNNER_TEMP/sekret-publish-production-release-observation.mjs"');

  for (const [label, index] of [
    ['current main lookup', currentMainIndex],
    ['trusted publisher fetch', trustedPublisherIndex],
    ['target format validation', targetFormatIndex],
    ['release checkout', checkoutIndex],
    ['blocked observation step', blockerIndex],
    ['trusted blocker publisher run', trustedBlockerRunIndex],
  ]) {
    assert.notEqual(index, -1, `${label} must exist`);
  }

  assert.ok(
    currentMainIndex < trustedPublisherIndex && trustedPublisherIndex < targetFormatIndex,
    'Trusted current-main publisher code must be retained before malformed or stale targets can fail',
  );
  assert.ok(
    targetFormatIndex < checkoutIndex,
    'Untrusted target-controlled code must never be checked out before validation',
  );
  assert.ok(
    blockerIndex < trustedBlockerRunIndex,
    'The blocked-attempt step must execute the trusted runner-temp publisher',
  );
});

test('production verifier serializes release checks and revalidates current main immediately before secret-backed schema proof', () => {
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /concurrency:\n\s+group: cloudflare-native-production\n\s+cancel-in-progress: true/);
  assert.doesNotMatch(workflow, /group: cloudflare-native-production-\$\{\{/);
  assert.match(workflow, /name: Revalidate current main before Production secret use/);
  assert.match(workflow, /id: trusted_current_main/);
  assert.match(workflow, /Production verification target is no longer current main; refusing secret-backed verification/);
  assert.match(workflow, /"trusted_current_main":"\$\{\{ steps\.trusted_current_main\.outcome \}\}"/);

  const installIndex = workflow.indexOf('name: Install repository dependencies');
  const revalidateIndex = workflow.indexOf('name: Revalidate current main before Production secret use');
  const schemaWitnessIndex = workflow.indexOf('name: Verify exact Supabase production schema contract');
  const secretIndex = workflow.indexOf('SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}');

  for (const [label, index] of [
    ['dependency install', installIndex],
    ['current-main revalidation', revalidateIndex],
    ['schema witness', schemaWitnessIndex],
    ['Supabase token injection', secretIndex],
  ]) {
    assert.notEqual(index, -1, `${label} must exist`);
  }

  assert.ok(
    installIndex < revalidateIndex && revalidateIndex < schemaWitnessIndex,
    'Current main must be revalidated after target-controlled setup and immediately before the secret-backed witness',
  );
  assert.ok(
    schemaWitnessIndex < secretIndex,
    'The Production token must remain scoped to the schema-witness step only',
  );
});
