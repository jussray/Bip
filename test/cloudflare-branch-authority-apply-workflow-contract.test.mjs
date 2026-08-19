import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/cloudflare-branch-authority-apply.yml', import.meta.url), 'utf8');

test('founder apply workflow is manual-only, exact-main pinned, dedicated-token only, and readback gated', () => {
  assert.match(workflow, /name: Apply Cloudflare Worker Branch Authority Repair/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\npush:/);
  assert.match(workflow, /expected_main_sha:/);
  assert.match(workflow, /FIX_646_MAIN_ONLY_WORKER_BUILDS/);
  assert.match(workflow, /test \"\$GITHUB_ACTOR\" = \"jussray\"/);
  assert.match(workflow, /test \"\$EXPECTED_MAIN_SHA\" = \"\$GITHUB_SHA\"/);
  assert.match(workflow, /git ls-remote/);
  assert.match(workflow, /CLOUDFLARE_WORKERS_BUILDS_API_TOKEN/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /cloudflare-worker-branch-authority-before\.json/);
  assert.match(workflow, /method: 'PUT'/);
  assert.match(workflow, /method: 'DELETE'/);
  assert.match(workflow, /method: 'PATCH'/);
  assert.match(workflow, /post-mutation readback is not main-only/);
  assert.match(workflow, /VERIFIED_AFTER_FOUNDER_APPLY/);
});
