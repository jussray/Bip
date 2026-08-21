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
  assert.match(workflow, /Check out exact current main without credentials/);
  assert.match(
    workflow,
    /uses: actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/,
  );
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /uses: actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /CLOUDFLARE_WORKERS_BUILDS_API_TOKEN/);
  assert.match(workflow, /verify-cloudflare-worker-branch-authority\.mjs/);
  assert.match(workflow, /verify-cloudflare-pages-branch-authority\.mjs/);
  assert.match(workflow, /if-no-files-found: error/);

  const checkoutIndex = workflow.indexOf('Check out exact current main without credentials');
  const setupNodeIndex = workflow.indexOf('Use repository proof runtime');
  const providerReadIndex = workflow.indexOf(
    'Read current two-Worker topology and verify production Worker branch authority',
  );
  assert.ok(checkoutIndex >= 0);
  assert.ok(setupNodeIndex > checkoutIndex);
  assert.ok(providerReadIndex > setupNodeIndex);

  assert.match(workerVerifier, /mode: 'read-only'/);
  assert.match(workerVerifier, /mutationPerformed: false/);
  assert.match(workerVerifier, /verificationStatus: 'started'/);
  assert.match(workerVerifier, /function writeReceipt\(\)/);
  assert.match(workerVerifier, /function fail\(stage, error\)/);
  assert.match(workerVerifier, /classification: 'provider-read-failed'/);
  assert.match(workerVerifier, /writeReceipt\(\);\nif \(!accountId\)/);
  assert.match(workerVerifier, /get\('\/user\/tokens\/verify', 'token-verification'\)/);
  assert.match(workerVerifier, /const separateWorker = 'sekret'/);
  assert.match(workerVerifier, /const productionWorker = 'sekret-backend'/);
  assert.match(workerVerifier, /const alphaWorker = 'sekret-backend-alpha'/);

  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /method:\s*['\"]?(?:PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(workflow, /\/cancel(?:\b|`|\$\{)/);
  assert.doesNotMatch(workflow, /deletedPreviewTriggers|cancelledNonMainBuilds/);
});
