import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/cloudflare-worker-write-authority.yml', 'utf8');

test('Worker write authority stays explicit, exact-main, and separate from read-only Builds credentials', () => {
  for (const required of [
    'workflow_dispatch:',
    'target_sha:',
    'environment: Production',
    'BIP_WORKER_NAME: sekret-backend',
    'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
    'test "$EXPECTED_HEAD_SHA" = "$current_main"',
    'ref: ${{ env.EXPECTED_HEAD_SHA }}',
    'persist-credentials: false',
    "CLOUDFLARE_WORKERS_BUILDS_API_TOKEN: ''",
    'node scripts/reconcile-cloudflare-workers-build-trigger.mjs --apply',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
  ]) {
    assert.ok(workflow.includes(required), `missing Worker write-authority contract: ${required}`);
  }

  assert.ok(!workflow.includes('pull_request:'), 'write-authority workflow must never execute from pull requests');
  assert.ok(!workflow.includes('push:'), 'write-authority workflow must never execute automatically from pushes');
  assert.ok(!workflow.includes('CLOUDFLARE_WORKERS_BUILDS_API_TOKEN: ${{ secrets.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN }}'), 'read-only/dedicated Builds credential must not gain write authority');
  assert.ok(!workflow.includes('wrangler deploy'), 'trigger-repair authority must not become an independent direct production deploy lane');
});
