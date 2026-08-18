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

test('Product Design proof cannot skip a fresh main SHA because of push path filtering', () => {
  const pullRequest = sectionBetween('  pull_request:', '  push:');
  const push = sectionBetween('  push:', '  workflow_dispatch:');

  assert.match(pullRequest, /^\s+paths:/m, 'pull requests should keep the scoped path filter');
  assert.match(push, /branches:\s*\[main\]/, 'main push proof must target main');
  assert.doesNotMatch(push, /^\s+paths:/m, 'main visual proof must not be path-filtered');
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
    'test/founder-visual-authority-contract.test.mjs',
    'test/founder-visual-approval-receipt.test.mjs',
    'test/pages-companion-asset-contract.test.mjs',
    'test/calm-companion-motion-contract.test.mjs',
  ]) {
    assert.ok(workflow.includes(required), `missing Product Design workflow contract: ${required}`);
  }

  assert.ok(!workflow.includes('ref: ${{ github.sha }}'), 'PR evidence must not validate the synthetic merge SHA');
});

test('visual PR proof fails closed until the founder approves the exact head artifact', () => {
  for (const required of [
    'issues: read',
    'pull-requests: read',
    'Verify exact-head founder visual approval receipt',
    "if: github.event_name == 'pull_request'",
    'GITHUB_TOKEN: ${{ github.token }}',
    'PR_NUMBER: ${{ github.event.pull_request.number }}',
    'FOUNDER_GITHUB_LOGIN: jussray',
    'node scripts/verify-founder-visual-approval.mjs',
  ]) {
    assert.ok(workflow.includes(required), `missing founder approval workflow gate: ${required}`);
  }

  const uploadIndex = workflow.indexOf('Upload Product Design evidence');
  const approvalIndex = workflow.indexOf('Verify exact-head founder visual approval receipt');
  assert.ok(uploadIndex !== -1 && approvalIndex > uploadIndex, 'founder approval must be checked only after the exact-head packet is uploaded for inspection');
});
