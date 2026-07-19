import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('invite screen preserves lookup errors', async () => {
  const screen = await read('app/(auth)/parent-link-verify.tsx');
  const lookup = await read('src/utils/pendingParentInvite.ts');
  assert.match(screen, /fetchPendingInviteCodeResult/);
  assert.match(screen, /if \(!lookup\.ok\)/);
  assert.match(screen, /Retry existing code check/);
  assert.match(screen, /generateInviteCodeResult/);
  assert.match(lookup, /ParentLinkResult<string \| null>/);
  assert.match(lookup, /ok: true, value: null/);
  assert.match(lookup, /ok: false/);
});

test('limited mode redirects only after a hydrated unverified state', async () => {
  const source = await read('app/(auth)/limited-mode.tsx');
  assert.match(source, /isVerificationLoading/);
  assert.match(source, /verificationState === 'UNVERIFIED'/);
  assert.doesNotMatch(source, /verificationState === 'LIMITED_MODE'/);
  assert.match(source, /router\.replace\('\/\(auth\)\/parent-link-verify'\)/);
});

test('pending code lookup remains explicit', async () => {
  const lookup = await read('src/utils/pendingParentInvite.ts');
  assert.match(lookup, /status', 'pending'/);
  assert.match(lookup, /expires_at/);
  assert.match(lookup, /Could not check your existing invite code/);
});

test('shared route resolves to invite screen', async () => {
  const routes = await read('src/shared/routes.ts');
  assert.match(routes, /'parent-link-verify': TEEN_ROUTES\.parentLinkVerify/);
});

test('parent setup continues to code entry', async () => {
  const source = await read('app/(onboarding)/parent-setup.tsx');
  assert.match(source, /submitGuardianVerification\(\)/);
  assert.match(source, /router\.replace\('\/\(onboarding\)\/parent-link'\)/);
  assert.match(source, /Continue to private code/);
});

test('code redemption uses the protected helper', async () => {
  const screen = await read('app/(onboarding)/parent-link.tsx');
  const helper = await read('src/utils/parentLink.ts');
  assert.match(screen, /redeemInviteCodeResult/);
  assert.match(screen, /Continue to guardian verification/);
  assert.match(helper, /redeem_parent_link_invite/);
  assert.match(helper, /p_invite_code: normalized/);
});
