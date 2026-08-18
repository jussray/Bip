import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(
  'components/intentions/DailyIntentionsCard.tsx',
  'utf8',
);

const sanctuary = readFileSync(
  'components/rooms/LivingSanctuaryLayer.tsx',
  'utf8',
);

const roomRoute = readFileSync(
  'app/(teen)/room.tsx',
  'utf8',
);

const roomScreen = readFileSync(
  'screens/UserRoomScreen.tsx',
  'utf8',
);

const themeEntry = readFileSync(
  'constants/theme.ts',
  'utf8',
);

const workflow = readFileSync(
  '.github/workflows/product-design-playwright-proof.yml',
  'utf8',
);

test('Teen Room arrives with daily intentions collapsed so the room remains primary', () => {
  assert.ok(
    component.includes('const [expanded, setExpanded] = useState(false);'),
    'Daily intentions must not cover the living Room on first arrival',
  );

  assert.ok(
    component.includes("accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} today's intentions`}"),
    'Collapsed intentions must remain explicitly discoverable and expandable',
  );

  assert.ok(
    component.includes('const COLLAPSED_CARD_WIDTH = Math.min(CARD_WIDTH, 174);'),
    'Collapsed intentions must stay visually subordinate to the Room',
  );

  assert.ok(
    component.includes('<Text style={s.collapsedLabel}>✦ today</Text>'),
    'Collapsed intentions should render as a small peek, not the full panel title',
  );
});

test('collapsed daily intentions leave the Room utility rail reachable', () => {
  assert.ok(
    component.includes('{ width: expanded ? CARD_WIDTH : COLLAPSED_CARD_WIDTH }'),
    'Intentions should return to full width only when the user explicitly expands them',
  );
  assert.ok(
    component.includes('!expanded && s.cardCollapsed'),
    'Collapsed intentions must use the quieter pill presentation',
  );
});

test('Room owns one canonical companion visual with separate bounded interaction geometry', () => {
  assert.ok(
    roomRoute.includes("import { LivingSanctuaryLayer } from '../../components/rooms/LivingSanctuaryLayer';"),
    'Teen Room must retain the Living Sanctuary atmosphere layer',
  );
  assert.ok(
    roomRoute.includes('<LivingSanctuaryLayer companionKey={companionKey} />'),
    'The route must preserve the established companion compatibility boundary',
  );
  assert.ok(
    sanctuary.includes('pointerEvents="none"'),
    'The atmosphere layer must never intercept Room interactions',
  );
  assert.doesNotMatch(
    sanctuary,
    /Image|living-sanctuary-companion-visual|YOUR SANCTUARY|yours to explore|living-sanctuary-halo/,
    'Atmosphere must not render a second companion or restore rejected overlay chrome',
  );
  assert.ok(
    roomScreen.includes('const COMPANION_VISUAL_POSITIONS'),
    'Room must own explicit visual companion geometry',
  );
  assert.ok(
    roomScreen.includes('const COMPANION_HIT_TARGETS'),
    'Room must own a separate bounded companion interaction geometry',
  );
  assert.ok(
    roomScreen.includes('testID="room-companion-visual"'),
    'The one canonical companion visual must expose a deterministic witness',
  );
  assert.ok(
    roomScreen.includes('testID="room-companion-hit-target"'),
    'The bounded tap target must expose a deterministic witness',
  );
  assert.ok(
    roomScreen.includes('pointerEvents="none"\n        testID="room-companion-visual"'),
    'The enlarged visual must not itself capture taps',
  );
  assert.ok(
    roomScreen.includes('const cSrc        = safe(AVATARS[cId]?.fullbody, cRuntime.source ?? cPoseSrc);'),
    'Room staging must prefer the approved full-body pose while retaining canonical-runtime fallback authority',
  );
  assert.doesNotMatch(roomScreen, /const COMPANION_POSITIONS/);
});

test('public theme entry wires the production Suhana standing asset to rayleneFullbody', () => {
  assert.ok(
    themeEntry.includes("const rayleneFullbody = require('../assets/images/raylene-fullbody.png');"),
    'The public image map must use the actual production full-body standing asset',
  );
  assert.match(themeEntry, /\.\.\.BASE_IMAGES,[\s\S]*rayleneFullbody,/);
});

test('Living Sanctuary atmosphere remains presentation-only and physically still', () => {
  assert.doesNotMatch(sanctuary, /Animated\.|useReducedMotion|setInterval|setTimeout/);
  assert.doesNotMatch(sanctuary, /AsyncStorage|router\.|setScreen\(|supabase/i);
});

test('Product Design proof watches shared component visual surfaces', () => {
  assert.ok(
    workflow.includes("- 'components/**'"),
    'Shared component changes must trigger Product Design proof on pull requests',
  );

  assert.ok(
    workflow.includes('test/room-intentions-hierarchy-contract.test.mjs'),
    'The Room intentions hierarchy contract must execute in Product Design proof',
  );
});
