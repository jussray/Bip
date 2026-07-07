import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('private account cache clears parent onboarding, link, and test-family state', async () => {
  const source = await read('src/utils/storage.ts');
  assert.match(source, /const PRIVATE_ACCOUNT_KEYS = \[/);
  assert.match(source, /'parent_profile_data'/);
  assert.match(source, /'parent_profile_done'/);
  assert.match(source, /'linked_teen_id'/);
  assert.match(source, /'dev_test_family_v1'/);
  assert.match(source, /clearPrivateAccountCache/);
  assert.match(source, /AsyncStorage\.multiRemove\(\[\.\.\.PRIVATE_ACCOUNT_KEYS\]\)/);
});

test('root auth boundary uses private cache clearing on sign out', async () => {
  const source = await read('app/_layout.tsx');
  assert.match(source, /clearPrivateAccountCache/);
  assert.match(source, /SIGNED_OUT/);
  assert.match(source, /router\.replace\('\/\(auth\)\/login'\)/);
});
