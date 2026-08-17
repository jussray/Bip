import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/audit-cloudflare-access-coverage.yml', 'utf8');

test('Cloudflare Access audit binds PR validation and evidence to the exact candidate head', () => {
  for (const required of [
    'EXPECTED_HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}',
    'ref: ${{ env.EXPECTED_HEAD_SHA }}',
    'test "$actual" = "$EXPECTED_HEAD_SHA"',
    'test "$EXPECTED_HEAD_SHA" = "$current_main"',
    'name: cloudflare-access-coverage-${{ env.EXPECTED_HEAD_SHA }}',
  ]) {
    assert.ok(workflow.includes(required), `missing exact-head contract: ${required}`);
  }

  assert.ok(
    !workflow.includes('ref: ${{ github.sha }}'),
    'pull-request audit must not validate GitHub synthetic merge SHA as the reviewed candidate head',
  );
});
