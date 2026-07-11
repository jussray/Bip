import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent invite completion validates the atomic RPC response', async () => {
  const source = await read('src/utils/parentLink.ts');
  assert.match(source, /parseRedeemedParentLink/);
  assert.match(source, /extractRedeemedTeenId/);
  assert.match(source, /typeof row\?\.teen_user_id === 'string'/);
  assert.match(source, /row\.teen_user_id\.length > 0/);
  assert.match(source, /row\.parent_user_id !== expectedParentId/);
  assert.match(source, /row\.status !== 'active'/);
  assert.match(source, /typeof row\.link_id !== 'string'/);
  assert.match(source, /return \{ ok: true, value: redeemedLink \}/);
});

test('parent onboarding writes completion only from the verified RPC result', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.doesNotMatch(source, /fetchLinkedTeenId/);
  assert.match(source, /result\.value\.teenUserId/);
  const resultIndex = source.indexOf('const result = await redeemInviteCode(normalized)');
  const writeIndex = source.indexOf("['parent_profile_done', 'true']");
  assert.notEqual(resultIndex, -1);
  assert.notEqual(writeIndex, -1);
  assert.ok(resultIndex < writeIndex, 'verified RPC result must exist before completion is written');
});

test('parent onboarding clears local completion cache if local persistence fails', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.match(source, /AsyncStorage\.multiRemove\(\['parent_profile_done', 'linked_teen_id'\]\)/);
});

test('no-code parent action stays on the code screen and shows recovery instructions', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.match(source, /needsCodeHelp/);
  assert.match(source, /setNeedsCodeHelp\(true\)/);
  assert.match(source, /Ask your teen to open Limited Mode/);
  assert.doesNotMatch(source, /router\.replace\('\/\(onboarding\)\/parent-welcome'\)/);
});
