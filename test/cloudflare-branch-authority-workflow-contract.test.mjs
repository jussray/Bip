import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
  new URL('../.github/workflows/cloudflare-branch-authority.yml', import.meta.url),
  'utf8',
);
const workerVerifier = await readFile(
  new URL('../scripts/verify-cloudflare-worker-branch-authority.mjs', import.meta.url),
  'utf8',
);

test('Cloudflare Worker and Pages branch-authority workflow is read-only and exact-current-main gated', () => {
  assert.match(workflow, /name: Audit Cloudflare Worker and Pages Branch Authority/);
  assert.match(workflow, /Verify exact current main before provider credential use/);
  assert.match(workflow, /git ls-remote/);
  assert.match(workflow, /test \"\$GITHUB_SHA\" = \"\$current_main\"/);
  assert.match(workflow, /CLOUDFLARE_WORKERS_BUILDS_API_TOKEN/);
  assert.match(workflow, /verify-cloudflare-worker-branch-authority\.mjs/);
  assert.match(workflow, /verify-cloudflare-pages-branch-authority\.mjs/);

  assert.match(workerVerifier, /mode: 'read-only'/);
  assert.match(workerVerifier, /mutationPerformed: false/);
  assert.match(workerVerifier, /const separateWorker = 'sekret'/);
  assert.match(workerVerifier, /const productionWorker = 'sekret-backend'/);
  assert.match(workerVerifier, /const alphaWorker = 'sekret-backend-alpha'/);

  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /method:\s*['\"]?(?:PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(workflow, /\/cancel(?:\b|`|\$\{)/);
  assert.doesNotMatch(workflow, /deletedPreviewTriggers|cancelledNonMainBuilds/);
});
