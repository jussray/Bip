import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync('app/(teen)/room.tsx', 'utf8');
const atmosphere = readFileSync('components/rooms/VisualCanonAtmosphere.tsx', 'utf8');

test('Teen Room mounts the visual-canon atmosphere between the room and utility overlays', () => {
  assert.ok(
    route.includes("import { VisualCanonAtmosphere } from '../../components/rooms/VisualCanonAtmosphere';"),
    'Teen Room must import the canon atmosphere layer',
  );

  const roomIndex = route.indexOf('<UserRoomScreen');
  const canonIndex = route.indexOf('<VisualCanonAtmosphere />');
  const intentionsIndex = route.indexOf('<DailyIntentionsCard');

  assert.ok(roomIndex >= 0 && canonIndex > roomIndex, 'canon atmosphere must render after the illustrated Room');
  assert.ok(intentionsIndex > canonIndex, 'utility cards must render above the non-interactive atmosphere layer');
  assert.ok(route.includes("backgroundColor: '#09031c'"), 'Room shell must retain the approved midnight-violet base');
});

test('Visual canon atmosphere is art-led, non-interactive, and motion restrained', () => {
  assert.ok(
    atmosphere.includes('testID="room-visual-canon-atmosphere"'),
    'the visual canon layer needs a deterministic runtime witness',
  );
  assert.ok(atmosphere.includes('pointerEvents="none"'), 'atmosphere must never steal Room interactions');
  assert.ok(atmosphere.includes("'rgba(12, 4, 36, 0.46)'"), 'deep violet moonlight must anchor the scene');
  assert.ok(atmosphere.includes("'rgba(229, 209, 255, 0.92)'"), 'lilac star light must remain part of the visual grammar');
  assert.ok(atmosphere.includes('duration: 3200'), 'ambient shimmer must remain slow and cinematic');
  assert.doesNotMatch(atmosphere, /TouchableOpacity|Pressable|Button/);
});
