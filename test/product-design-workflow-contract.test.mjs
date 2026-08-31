import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/product-design-playwright-proof.yml', 'utf8');

function sectionBetween(startMarker, endMarker) {
  const start = workflow.indexOf(startMarker);
  const end = workflow.indexOf(endMarker, start + startMarker.length);

  assert.notEqual(start, -1, `missing workflow section: ${startMarker}`);
  assert.notEqual(end, -1, `missing workflow boundary: ${endMarker}`);

  return workflow.slice(start, end);
}

test('Product Design proof cannot skip fresh main or phase2 visual heads because of push path filtering', () => {
  const pullRequest = sectionBetween('  pull_request:', '  push:');
  const push = sectionBetween('  push:', '  workflow_dispatch:');

  assert.match(pullRequest, /^\s+paths:/m, 'pull requests should keep the scoped path filter');
  assert.match(
    push,
    /branches:\s*\[main, 'phase2\/\*\*'\]/,
    'push proof must cover main and reusable phase2 visual carriers',
  );
  assert.doesNotMatch(push, /^\s+paths:/m, 'visual push proof must not be path-filtered');
});

test('Product Design proof remains exact-head and failure-preserving', () => {
  for (const required of [
    'EXPECTED_HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}',
    'ref: ${{ env.EXPECTED_HEAD_SHA }}',
    'persist-credentials: false',
    'test "$actual" = "$EXPECTED_HEAD_SHA"',
    'if: always()',
    'name: product-design-playwright-${{ env.EXPECTED_HEAD_SHA }}',
    'path: artifacts/product-design-playwright',
    'if-no-files-found: error',
    'retention-days: 30',
    'e2e/room-canonical-display.spec.ts',
    'e2e/canonical-companion-identity.spec.ts',
    'e2e/guardrails.spec.ts',
    'e2e/sy-companion-moment.spec.ts',
    'test/founder-visual-authority-contract.test.mjs',
    'test/pages-companion-asset-contract.test.mjs',
    'test/sy-companion-moment-contract.test.mjs',
  ]) {
    assert.ok(workflow.includes(required), `missing Product Design workflow contract: ${required}`);
  }

  assert.ok(
    !workflow.includes('ref: ${{ github.sha }}'),
    'PR evidence must not validate the synthetic merge SHA',
  );
});
