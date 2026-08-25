import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/rooms/roomSceneComposition.ts', 'utf8');

test('Night is the first declarative user-room scene slice', () => {
  assert.match(source, /NIGHT_USER_ROOM_SCENE/);
  assert.match(source, /companionKey:\s*'night'/);
  assert.match(source, /anchor:\s*'window-seat'/);
});

test('Night composition encodes mixed practical and moon lighting', () => {
  assert.match(source, /lighting:\s*'mixed'/);
  assert.match(source, /nearbyProps:\s*\['lamp', 'desk', 'notes', 'blanket'\]/);
});

test('scene composition stays device-independent and declarative', () => {
  assert.match(source, /position:\s*\{ x:\s*18, y:\s*47 \}/);
  assert.match(source, /scale:\s*0\.92/);
  assert.match(source, /Partial<Record<Character, RoomSceneComposition>>/);
});
