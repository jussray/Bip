import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent setup continues to invite-code redemption', async () => {
  const source = await read('app/(onboarding)/parent-setup.tsx');
  assert.match(source, /parent-link/);
  assert.doesNotMatch(source, /router\.replace\('\/\(parent\)\/room'\)/);
  assert.match(source, /removeItem\('parent_profile_done'\)/);
});

test('parent link screen redeems code and completes onboarding only after success', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.match(source, /redeemInviteCode\(normalized\)/);
  assert.match(source, /parent_profile_done/);
  assert.match(source, /linked_teen_id/);
  assert.match(source, /router\.replace\('\/\(parent\)\/room'\)/);
});
