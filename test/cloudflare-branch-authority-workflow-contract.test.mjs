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
  assert.match(workflow, /Set up Node for Cloudflare authority verifier/);
  assert.match(
    workflow,
    /uses: actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/,
  );
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /CLOUDFLARE_WORKERS_BUILDS_API_TOKEN/);
  assert.match(workflow, /verify-cloudflare-worker-branch-authority\.mjs/);
  assert.match(workflow, /verify-cloudflare-pages-branch-authority\.mjs/);

  const checkoutIndex = workflow.indexOf('Check out exact current main without credentials');
  const setupNodeIndex = workflow.indexOf('Set up Node for Cloudflare authority verifier');
  const providerReadIndex = workflow.indexOf(
    'Read current two-Worker topology and verify production Worker branch authority',
  );
  assert.ok(checkoutIndex >= 0);
  assert.ok(setupNodeIndex > checkoutIndex);
  assert.ok(providerReadIndex > setupNodeIndex);

  assert.match(workerVerifier, /schemaVersion: 6/);
  assert.match(workerVerifier, /mode: 'read-only'/);
  assert.match(workerVerifier, /mutationPerformed: false/);
  assert.match(workerVerifier, /status: 'started'/);
  assert.match(workerVerifier, /receipt\.status = 'blocked'/);
  assert.match(workerVerifier, /providerPath: path/);
  assert.match(workerVerifier, /providerStatus: response\.status/);
  assert.match(workerVerifier, /receipt\.status = 'verified'/);
  assert.match(workerVerifier, /const separateWorker = 'sekret'/);
  assert.match(workerVerifier, /const productionWorker = 'sekret-backend'/);
  assert.match(workerVerifier, /const alphaWorker = 'sekret-backend-alpha'/);

  const initialReceiptIndex = workerVerifier.indexOf('writeReceipt();');
  const tokenVerifyIndex = workerVerifier.indexOf("await get('/user/tokens/verify')");
  assert.ok(initialReceiptIndex >= 0);
  assert.ok(tokenVerifyIndex > initialReceiptIndex);

  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /method:\s*['\"]?(?:PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(workflow, /\/cancel(?:\b|`|\$\{)/);
  assert.doesNotMatch(workflow, /deletedPreviewTriggers|cancelledNonMainBuilds/);
});
