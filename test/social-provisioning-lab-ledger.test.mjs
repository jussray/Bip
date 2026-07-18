import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('social provisioning lab has a truthful implementation evidence record', async () => {
  const extension = JSON.parse(await read('implementation-ledger.extensions/social-provisioning-lab.json'));

  assert.equal(extension.id, 'social-provisioning-lab');
  assert.equal(extension.name, 'Founder-only social account provisioning rehearsal and coordinated-AI lanes');
  assert.equal(extension.status, 'integrated');
  assert.equal(extension.ownerIssue, 'https://github.com/jussray/Sekret-Bip/issues/486');
  assert.ok(extension.acceptanceCriteria.length >= 2);
  assert.ok(extension.contractPaths.length >= 1);
  assert.ok(extension.runtimePaths.length >= 1);
  assert.ok(extension.testPaths.length >= 1);
  assert.ok(extension.telemetryPaths.length >= 1);
  assert.equal(extension.verification.state, 'partial');
  assert.equal(typeof extension.verification.evidence, 'string');
  assert.equal(extension.privacy.storesCredentials, false);
  assert.equal(extension.privacy.createsExternalAccounts, false);
  assert.equal(extension.privacy.usesTeenOrParentData, false);
  assert.equal(extension.privacy.liveAccountClaimAllowed, false);
  assert.equal(extension.rollout.state, 'founder-only');
  assert.equal(extension.rollout.controlPath, 'src/features/control-room/SocialProvisioningLabPanel.tsx');
  assert.match(extension.rollout.controlKey, /can_manage_app/);
  assert.equal(extension.rollout.productionMutation, false);
});
