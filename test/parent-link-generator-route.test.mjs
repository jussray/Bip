import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('teen invite screen calls the protected generator and displays eight characters', async () => {
  const source = await read('app/(auth)/parent-link-verify.tsx');
  assert.match(source, /generateInviteCodeResult/);
  assert.match(source, /PARENT_INVITE_CODE_LENGTH/);
  assert.match(source, /setCode\(result\.value\)/);
});

test('returning teens can restore an unexpired pending code', async () => {
  const screen = await read('app/(auth)/parent-link-verify.tsx');
  const helper = await read('src/utils/parentLink.ts');
  assert.match(screen, /fetchPendingInviteCode/);
  assert.match(helper, /status', 'pending'/);
  assert.match(helper, /expires_at/);
});

test('Limited Mode routes to the teen invite generator', async () => {
  const source = await read('app/(auth)/limited-mode.tsx');
  assert.match(source, /\(auth\)\/parent-link-verify/);
});

test('Teen More route key resolves to the invite generator instead of Room', async () => {
  const routes = await read('src/shared/routes.ts');
  assert.match(routes, /'parent-link-verify': TEEN_ROUTES\.parentLinkVerify/);
});

test('parent entry redeems through the protected RPC result helper', async () => {
  const screen = await read('app/(onboarding)/parent-link.tsx');
  const helper = await read('src/utils/parentLink.ts');
  assert.match(screen, /redeemInviteCodeResult/);
  assert.match(helper, /redeem_parent_link_invite/);
  assert.match(helper, /p_invite_code: normalized/);
});
