import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('social provisioning lab has a truthful implementation evidence record', async () => {
  const extension = JSON.parse(await read('implementation-ledger.extensions/social-provisioning-lab.json'));

  assert.equal(extension.id, 'social-provisioning-lab');
  assert.equal(extension.status, 'integrated');
  assert.equal(extension.verification.state, 'partial');
  assert.equal(extension.privacy.storesCredentials, false);
  assert.equal(extension.privacy.createsExternalAccounts, false);
  assert.equal(extension.privacy.usesTeenOrParentData, false);
  assert.equal(extension.privacy.liveAccountClaimAllowed, false);
  assert.equal(extension.rollout.state, 'founder-only');
  assert.equal(extension.rollout.productionMutation, false);
});
