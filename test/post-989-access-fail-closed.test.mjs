import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const reconciler = await readFile('scripts/reconcile-cloudflare-public-apex-access.mjs', 'utf8');
const workflow = await readFile('.github/workflows/reconcile-cloudflare-public-apex-access.yml', 'utf8');
const browserContract = await readFile('test/cloudflare-production-browser-contract.test.mjs', 'utf8');

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

test('ambiguous Access create outcomes are provider-reconciled before recording mutation state', () => {
  assert.match(reconciler, /preCreate|beforeCreate|existingAppIds|preExistingAppIds/i);
  assert.match(reconciler, /ambiguous|recover.*create|reconcile.*create/i);
  assert.match(reconciler, /mutation.*unknown|unknown.*mutation/i);
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
  assert.match(browserContract, /sekretbip\.net/);
  assert.doesNotMatch(
    browserContract,
    /require[^\n]*app\.sekretbip\.net|includes\([^\n]*app\.sekretbip\.net/i,
    'browser contract must not require the stale app subdomain after apex migration',
  );
});
