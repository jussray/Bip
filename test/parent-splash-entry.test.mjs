import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../app/(onboarding)/parent-splash.tsx', import.meta.url),
  'utf8',
);

test('parent splash stays locked briefly before accepting entry', () => {
  assert.equal(source.includes('ENTRY_LOCK_MS = 900'), true);
  assert.equal(source.includes('useState(false)'), true);
  assert.equal(source.includes('setTimeout(() => setEntryEnabled(true)'), true);
  assert.equal(source.includes('if (!entryEnabled) return'), true);
});
