import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent invite completion verifies the active backend relationship before entering parent side', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.match(source, /fetchLinkedTeenId/);
  assert.match(source, /async function verifyRedeemedLink\(expectedTeenId: string\)/);
  assert.match(source, /const activeTeenId = await fetchLinkedTeenId\(\)/);
  assert.match(source, /activeTeenId === expectedTeenId/);
  assert.match(source, /const verified = await verifyRedeemedLink\(result\.value\)/);
  assert.match(source, /if \(!verified\)/);
  assert.match(source, /AsyncStorage\.multiRemove\(\['parent_profile_done', 'linked_teen_id'\]\)/);
});

test('parent profile completion is written only after relationship verification succeeds', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  const verifyIndex = source.indexOf('const verified = await verifyRedeemedLink(result.value)');
  const writeIndex = source.indexOf("['parent_profile_done', 'true']");
  assert.notEqual(verifyIndex, -1);
  assert.notEqual(writeIndex, -1);
  assert.ok(verifyIndex < writeIndex, 'verification must happen before parent_profile_done is written');
});

test('no-code parent action stays on the code screen and shows recovery instructions', async () => {
  const source = await read('app/(onboarding)/parent-link.tsx');
  assert.match(source, /needsCodeHelp/);
  assert.match(source, /setNeedsCodeHelp\(true\)/);
  assert.match(source, /Ask your teen to open Limited Mode/);
  assert.doesNotMatch(source, /router\.replace\('\/\(onboarding\)\/parent-welcome'\)/);
});
