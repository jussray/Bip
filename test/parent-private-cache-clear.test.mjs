import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../src/utils/storage.ts', import.meta.url), 'utf8');

const required = [
  ['parentProfileData', 'parent_profile_data'],
  ['parentProfileDone', 'parent_profile_done'],
  ['linkedTeenId', 'linked_teen_id'],
  ['devTestFamilyV1', 'dev_test_family_v1'],
];

test('parent entry cache keys are canonical storage keys and private-account data', () => {
  for (const [property, value] of required) {
    assert.match(source, new RegExp(`${property}: '${value}'`));
    assert.match(source, new RegExp(`STORAGE_KEYS\\.${property}`));
  }
});

test('only structured parent cache values are parsed as JSON', () => {
  assert.match(source, /'parent_profile_data', 'dev_test_family_v1'/);
  assert.doesNotMatch(source, /'parent_profile_done'[^\]]*JSON_KEYS/);
  assert.doesNotMatch(source, /'linked_teen_id'[^\]]*JSON_KEYS/);
});

test('clearPrivateAccountCache removes the complete canonical private list', () => {
  assert.match(source, /AsyncStorage\.multiRemove\(\[\.\.\.PRIVATE_ACCOUNT_KEYS\]\)/);
});
