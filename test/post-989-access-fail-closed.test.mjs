import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { rollbackRunCreatedPublicApexAccess } from '../scripts/reconcile-cloudflare-public-apex-access.mjs';

const reconciler = await readFile('scripts/reconcile-cloudflare-public-apex-access.mjs', 'utf8');
const workflow = await readFile('.github/workflows/reconcile-cloudflare-public-apex-access.yml', 'utf8');
const browserContract = await readFile('test/cloudflare-production-browser-contract.test.mjs', 'utf8');
const productionFrontDoor = await readFile('e2e/production-public-front-door.spec.ts', 'utf8');

// Post-merge successor contract for the unresolved P1 findings left on #989.
test('managed Access identity is selected before destination validation', () => {
  assert.match(
    reconciler,
    /managedApps\s*=\s*apps\.filter\([^\n]*applicationName/s,
    'managed-name applications must be selected from the complete provider inventory before destination filtering',
  );
  assert.doesNotMatch(
    reconciler,
    /managedApps\s*=\s*exactPublicApps\.filter/,
    'destination filtering must not hide a drifted managed application',
  );
});

test('ambiguous Access create outcomes stay unknown and never acquire rollback authority', () => {
  assert.match(reconciler, /status:\s*'mutation-state-unknown'/);
  assert.match(reconciler, /mutationAttribution:\s*'unproven'/);
  assert.match(reconciler, /observedManagedCandidateCount/);
  assert.doesNotMatch(reconciler, /createdApp\s*=\s*recoverCreateCandidates/);
  assert.match(reconciler, /ROLLBACK_MUTATION_ATTRIBUTION_UNPROVEN/);
});

test('cleanup preserves an unknown Access mutation state instead of claiming rollback is unnecessary', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bip-access-rollback-'));
  const evidencePath = join(directory, 'evidence.json');
  const unknownEvidence = {
    schemaVersion: 2,
    status: 'mutation-state-unknown',
    mutationState: 'unknown',
    mutationAttribution: 'unproven',
    mutationPerformed: false,
    rollbackPerformed: false,
    targetHostname: 'sekretbip.net',
    applicationName: 'sekretbip.net - public apex bypass',
  };

  try {
    await writeFile(evidencePath, `${JSON.stringify(unknownEvidence)}\n`, 'utf8');
    const result = await rollbackRunCreatedPublicApexAccess({
      env: {
        CLOUDFLARE_ACCESS_API_TOKEN: 'test-token-not-used',
        CLOUDFLARE_ACCOUNT_ID: 'test-account-not-used',
        BIP_PUBLIC_ACCESS_EVIDENCE_PATH: evidencePath,
      },
    });
    const persisted = JSON.parse(await readFile(evidencePath, 'utf8'));

    assert.equal(result.status, 'rollback-blocked-mutation-state-unknown');
    assert.equal(result.mutationState, 'unknown');
    assert.equal(persisted.status, 'rollback-blocked-mutation-state-unknown');
    assert.equal(persisted.mutationState, 'unknown');
    assert.equal(persisted.mutationAttribution, 'unproven');
    assert.equal(persisted.rollbackPerformed, false);
    assert.notEqual(persisted.status, 'rollback-not-required');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('a provider-returned create identity is durably recorded before post-create proof calls', () => {
  const createIndex = reconciler.indexOf('createdApp = await createPublicBypassApplication(config)');
  const evidenceIndex = reconciler.indexOf("status: 'created-awaiting-proof'", createIndex);
  const policyIndex = reconciler.indexOf('const policies = await listPolicies(config, createdApp.id)', createIndex);
  const runtimeIndex = reconciler.indexOf('const runtimeAfter = await waitForPublicRuntime(config)', createIndex);

  assert.ok(createIndex >= 0, 'create call must exist');
  assert.ok(evidenceIndex > createIndex, 'rollback-capable evidence must follow a successful create response');
  assert.ok(policyIndex > evidenceIndex, 'rollback-capable evidence must precede post-create provider readback');
  assert.ok(runtimeIndex > evidenceIndex, 'rollback-capable evidence must precede runtime proof');
  assert.match(reconciler, /mutationAttribution:\s*'provider-returned-id'/);
});

test('post-mutation provider and runtime requests have explicit abort deadlines', () => {
  assert.match(reconciler, /AbortSignal\.timeout|AbortController|signal\s*:/);
  assert.match(reconciler, /timeout/i);
});

test('workflow cleanup covers cancellation as well as ordinary failure', () => {
  assert.match(
    workflow,
    /if:\s*[^\n]*(?:cancelled\(\)|always\(\))[^\n]*/,
    'rollback path must remain eligible when the apply job is cancelled',
  );
  assert.match(workflow, /--rollback-created/);
});

test('production browser contract follows the public apex destination', () => {
  assert.match(productionFrontDoor, /https:\/\/sekretbip\.net\//);
  assert.match(productionFrontDoor, /hostname\)\.toBe\('sekretbip\.net'\)/);
  assert.doesNotMatch(productionFrontDoor, /app\.sekretbip\.net/);
  assert.match(browserContract, /sekretbip\\\.net/);
  assert.doesNotMatch(
    browserContract,
    /require[^\n]*app\.sekretbip\.net|includes\([^\n]*app\.sekretbip\.net/i,
    'browser contract must not require the stale app subdomain after apex migration',
  );
});
