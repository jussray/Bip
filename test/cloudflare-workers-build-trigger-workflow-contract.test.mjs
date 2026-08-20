import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/cloudflare-workers-build-trigger.yml', 'utf8');

test('Workers Builds trigger workflow is exact-head, credential-minimal, and action-pinned', () => {
  for (const required of [
    'EXPECTED_HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}',
    'ref: ${{ env.EXPECTED_HEAD_SHA }}',
    'persist-credentials: false',
    'test "$actual" = "$EXPECTED_HEAD_SHA"',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN: ${{ secrets.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN }}',
    'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
  ]) {
    assert.ok(workflow.includes(required), `missing Workers trigger workflow contract: ${required}`);
  }

  assert.equal(
    (workflow.match(/persist-credentials: false/g) || []).length,
    2,
    'both Workers trigger checkout steps must disable persisted credentials',
  );
  assert.equal(
    (workflow.match(/- 'wrangler\.toml'/g) || []).length,
    2,
    'Wrangler identity changes must trigger this workflow for both pull requests and main pushes',
  );
  assert.ok(!/uses:\s+actions\/(?:checkout|setup-node|upload-artifact)@v\d+/u.test(workflow), 'Workers trigger actions must be SHA-pinned');
  assert.ok(!workflow.includes('persist-credentials: true'), 'Workers trigger checkout credentials must not persist');
});
