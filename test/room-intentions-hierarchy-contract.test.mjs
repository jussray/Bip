import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(
  'components/intentions/DailyIntentionsCard.tsx',
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
});

test('collapsed daily intentions leave the lower-right Room utility rail reachable', () => {
  assert.ok(
    component.includes('const COLLAPSED_CARD_WIDTH = Math.min(CARD_WIDTH, Math.max(220, SCREEN_WIDTH - 120));'),
    'Collapsed intentions must reserve a right-side interaction rail',
  );
  assert.ok(
    component.includes('width: expanded ? CARD_WIDTH : COLLAPSED_CARD_WIDTH'),
    'Intentions should return to full width only when the user explicitly expands them',
  );
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
