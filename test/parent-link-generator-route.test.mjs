import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('teen invite screen restores or automatically creates an eight-character code', async () => {
  const source = await read('app/(auth)/parent-link-verify.tsx');
  assert.match(source, /fetchPendingInviteCode/);
  assert.match(source, /generateInviteCodeResult/);
  assert.match(source, /PARENT_INVITE_CODE_LENGTH/);
  assert.match(source, /if \(existingCode\)/);
  assert.match(source, /setCode\(result\.value\)/);
});

test('Limited Mode sends a first-time unverified teen into code creation once', async () => {
  const source = await read('app/(auth)/limited-mode.tsx');
  assert.match(source, /verificationState === 'UNVERIFIED'/);
  assert.match(source, /verificationState === 'LIMITED_MODE'/);
  assert.match(source, /router\.replace\('\/\(auth\)\/parent-link-verify'\)/);
  assert.match(source, /PENDING_PARENT/);
});

test('returning teens can restore an unexpired pending code', async () => {
  const helper = await read('src/utils/parentLink.ts');
  assert.match(helper, /status', 'pending'/);
  assert.match(helper, /expires_at/);
});

test('Teen More route key resolves to the invite generator instead of Room', async () => {
  const routes = await read('src/shared/routes.ts');
  assert.match(routes, /'parent-link-verify': TEEN_ROUTES\.parentLinkVerify/);
});

test('parent setup continues directly to private code entry', async () => {
  const source = await read('app/(onboarding)/parent-setup.tsx');
  assert.match(source, /submitGuardianVerification\(\)/);
  assert.match(source, /router\.replace\('\/\(onboarding\)\/parent-link'\)/);
  assert.match(source, /Continue to private code/);
});

test('parent entry redeems through the protected RPC result helper', async () => {
  const screen = await read('app/(onboarding)/parent-link.tsx');
  const helper = await read('src/utils/parentLink.ts');
  assert.match(screen, /redeemInviteCodeResult/);
  assert.match(screen, /Continue to guardian verification/);
  assert.match(helper, /redeem_parent_link_invite/);
  assert.match(helper, /p_invite_code: normalized/);
});
