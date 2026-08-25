import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/rooms/userRoomCompanionState.ts', 'utf8');

test('persisted User Room companion outranks app/session bootstrap state', () => {
  assert.match(source, /if \(isCharacter\(input\.persistedCompanion\)\)/);
  assert.match(source, /return input\.persistedCompanion/);
  assert.match(source, /appSelectedCompanion/);
});

test('room companion state remains compatibility-key based internally', () => {
  assert.match(source, /'raylene', 'rylane', 'cloud', 'night'/);
  assert.doesNotMatch(source, /'suhana'\s*,\s*'sy'/i);
});

test('app companion synchronization is explicit rather than implicit', () => {
  assert.match(source, /shouldSyncAppCompanion/);
  assert.match(source, /roomCompanion/);
});
