import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent setup completes without requiring a teen invite code', async () => {
  const source = await read('app/(onboarding)/parent-setup.tsx');
  assert.match(source, /saveAccountProfile\(\{/);
  assert.match(source, /accountSide: 'parent'/);
  assert.match(source, /submitGuardianVerification\(\)/);
  assert.match(source, /\/\(auth\)\/guardian-verification/);
  assert.doesNotMatch(source, /\['parent_profile_done', 'true'\]/);
  assert.doesNotMatch(source, /router\.replace\('\/\(onboarding\)\/parent-link'\)/);
  assert.match(source, /No invite code required/);
});

test('parent link screen stores consent state without completing guardian identity', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.match(source, /redeemInviteCode\(normalized\)/);
  assert.match(source, /linked_teen_id/);
  assert.match(source, /handleLinkLater/);
  assert.match(source, /Link a teen later/);
  assert.match(source, /completeParentLinkStep/);
  assert.match(source, /router\.replace\('\/\(auth\)\/guardian-verification'\)/);
  assert.doesNotMatch(source, /parent_profile_done/);
});

test('unlinked parents get a clear CTA and linked-only routes stay gated', async () => {
  const source = await read('app/(parent)/room.tsx');
  assert.match(source, /linked_teen_id/);
  assert.match(source, /LINK_REQUIRED_ROUTES/);
  assert.match(source, /No teen linked yet/);
  assert.match(source, /Link a Teen/);
  assert.match(source, /parent-link/);
});
