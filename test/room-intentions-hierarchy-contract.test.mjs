import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(
  'components/intentions/DailyIntentionsCard.tsx',
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

const themeBase = readFileSync(
  'constants/theme.base.ts',
  'utf8',
);

const workflow = readFileSync(
  '.github/workflows/product-design-playwright-proof.yml',
  'utf8',
);

test('Teen Room arrives with daily intentions collapsed and visually subordinate', () => {
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
  assert.ok(
    component.includes('!expanded && s.cardCollapsed'),
    'Collapsed intentions must use the quieter pill presentation',
  );
});

test('Room owns one canonical companion visual with a separate bounded tap target', () => {
  assert.ok(
    roomScreen.includes('const COMPANION_VISUAL_POSITIONS'),
    'Room must own explicit visual companion geometry',
  );
  assert.ok(
    roomScreen.includes('const COMPANION_HIT_TARGETS'),
    'Room must own separate bounded companion interaction geometry',
  );
  assert.ok(
    roomScreen.includes('testID="room-companion-visual"'),
    'The canonical companion visual must expose a deterministic witness',
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
    'Room staging must prefer the full-body pose while retaining canonical runtime fallback authority',
  );
  assert.doesNotMatch(roomScreen, /const COMPANION_POSITIONS/);
});

test('Room scopes Suhana standing art through AVATARS without changing the shared IMAGES alias', () => {
  assert.match(
    themeBase,
    /const\s+rayleneFullbody\s*=\s*require\(["']\.\.\/assets\/images\/raylene-confident-new\.png["']\)/,
    'The historical shared IMAGES alias must remain untouched for non-Room consumers',
  );
  assert.match(
    themeEntry,
    /const\s+suhanaRoomFullbody\s*=\s*require\(["']\.\.\/assets\/images\/raylene-fullbody\.png["']\)/,
    'The public Room avatar map must load the production Suhana standing asset',
  );
  assert.match(
    themeEntry,
    /export const AVATARS = \{[\s\S]*raylene:\s*\{[\s\S]*fullbody:\s*suhanaRoomFullbody/,
    'Suhana full-body presentation must be overridden only through the Room avatar map',
  );

  const imageExport = themeEntry.match(/export const IMAGES = \{([\s\S]*?)\} as const;/)?.[1] ?? '';
  assert.doesNotMatch(
    imageExport,
    /rayleneFullbody/,
    'Public IMAGES must not override rayleneFullbody because Bippin2 consumes that compatibility key',
  );
});

test('Product Design proof watches the composition surfaces', () => {
  assert.ok(
    workflow.includes("- 'components/**'"),
    'Shared component changes must trigger Product Design proof on pull requests',
  );
  assert.ok(
    workflow.includes("- 'screens/**'"),
    'Room screen changes must trigger Product Design proof on pull requests',
  );
  assert.ok(
    workflow.includes('test/room-intentions-hierarchy-contract.test.mjs'),
    'The Room hierarchy contract must execute in Product Design proof',
  );
});
