import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const workflow = await readFile(
  new URL('../.github/workflows/cloudflare-branch-authority.yml', import.meta.url),
  'utf8',
);
const workerVerifierUrl = new URL(
  '../scripts/verify-cloudflare-worker-branch-authority.mjs',
  import.meta.url,
);
const workerVerifier = await readFile(workerVerifierUrl, 'utf8');

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
  assert.match(workflow, /if-no-files-found: error/);

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

test('Cloudflare Worker authority verifier retains a sanitized blocked receipt on early provider failure', async () => {
  const originalFetch = globalThis.fetch;
  const envKeys = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN',
    'EVIDENCE_PATH',
    'GITHUB_REF',
    'GITHUB_SHA',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const tempDir = await mkdtemp(join(tmpdir(), 'sekret-cloudflare-authority-'));
  const evidencePath = join(tempDir, 'receipt.json');

  process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
  process.env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN = 'test-token-secret';
  process.env.EVIDENCE_PATH = evidencePath;
  process.env.GITHUB_REF = 'refs/heads/main';
  process.env.GITHUB_SHA = '1111111111111111111111111111111111111111';
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ success: false, errors: [{ message: 'provider-body-must-not-be-retained' }] }),
  });

  let thrown;
  try {
    await import(`${workerVerifierUrl.href}?blocked-receipt-test=${Date.now()}`);
  } catch (error) {
    thrown = error;
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }

  try {
    assert.ok(thrown instanceof Error);
    assert.match(thrown.message, /GET \/user\/tokens\/verify failed with provider status 400/);

    const raw = await readFile(evidencePath, 'utf8');
    const receipt = JSON.parse(raw);
    assert.equal(receipt.status, 'blocked');
    assert.equal(receipt.mode, 'read-only');
    assert.equal(receipt.mutationPerformed, false);
    assert.equal(receipt.failure?.code, 'provider-http-failure');
    assert.equal(receipt.failure?.providerPath, '/user/tokens/verify');
    assert.equal(receipt.failure?.providerStatus, 400);
    assert.equal(raw.includes('test-token-secret'), false);
    assert.equal(raw.includes('provider-body-must-not-be-retained'), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
