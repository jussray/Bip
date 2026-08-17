import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/audit-cloudflare-zone-access-coverage.yml', 'utf8');

test('zone Access audit is exact-head, credential-minimal, and action-pinned', () => {
  for (const required of [
    'EXPECTED_HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}',
    'ref: ${{ env.EXPECTED_HEAD_SHA }}',
    'persist-credentials: false',
    'test "$actual" = "$EXPECTED_HEAD_SHA"',
    'test "$EXPECTED_HEAD_SHA" = "$current_main"',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    'CLOUDFLARE_ACCESS_API_TOKEN: ${{ secrets.CLOUDFLARE_ACCESS_API_TOKEN }}',
    'name: cloudflare-zone-access-coverage-${{ env.EXPECTED_HEAD_SHA }}',
  ]) {
    assert.ok(workflow.includes(required), `missing zone Access workflow contract: ${required}`);
  }

  assert.ok(!workflow.includes('ref: ${{ github.sha }}'), 'zone audit must not validate the synthetic PR merge SHA');
  assert.ok(!/uses:\s+actions\/(?:checkout|setup-node|upload-artifact)@v\d+/u.test(workflow), 'security-sensitive actions must be SHA-pinned');
  assert.ok(!workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'), 'zone Access audit must not receive the general Cloudflare API token');
  assert.ok(!workflow.includes('CLOUDFLARE_WORKERS_BUILDS_API_TOKEN: ${{ secrets.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN }}'), 'zone Access audit must not receive the Workers Builds token');
});
