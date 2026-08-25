import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('screens/UserRoomScreen.tsx', 'utf8');

test('UserRoomScreen consumes the user-owned companion precedence helper', () => {
  assert.match(source, /userRoomCompanionState/);
  assert.match(source, /resolveUserRoomCompanion/);
  assert.match(source, /shouldSyncAppCompanion/);
});

test('UserRoomScreen owns synchronization through the provided app setter', () => {
  assert.match(source, /setSelectedSekret/);
  assert.match(source, /setSelectedSekret\(.*companion/i);
});

test('persisted Room hydration participates in companion precedence', () => {
  assert.match(source, /persistedCompanion/);
  assert.match(source, /appSelectedCompanion/);
});
