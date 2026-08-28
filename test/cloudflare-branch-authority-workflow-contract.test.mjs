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
  assert.match(workflow, /test "\$GITHUB_SHA" = "\$current_main"/);
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
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /continue-on-error: true/);
  assert.match(workflow, /Require both independent provider readbacks/);
  assert.match(workflow, /verify-cloudflare-worker-branch-authority\.mjs/);
  assert.match(workflow, /verify-cloudflare-pages-branch-authority\.mjs/);
  assert.match(workflow, /if-no-files-found: error/);

  const checkoutIndex = workflow.indexOf('Check out exact current main without credentials');
  const setupNodeIndex = workflow.indexOf('Set up Node for Cloudflare authority verifier');
  const providerReadIndex = workflow.indexOf(
    'Read current three-Worker topology and verify Worker build authority',
  );
  assert.ok(checkoutIndex >= 0);
  assert.ok(setupNodeIndex > checkoutIndex);
  assert.ok(providerReadIndex > setupNodeIndex);

  assert.match(workerVerifier, /schemaVersion: 7/);
  assert.match(workerVerifier, /mode: 'read-only'/);
  assert.match(workerVerifier, /mutationPerformed: false/);
  assert.match(workerVerifier, /status: 'started'/);
  assert.match(workerVerifier, /receipt\.status = 'blocked'/);
  assert.match(workerVerifier, /providerStatus: response\.status/);
  assert.match(workerVerifier, /receipt\.status = 'verified'/);
  assert.match(workerVerifier, /const separateWorker = 'sekret'/);
  assert.match(workerVerifier, /const productionWorker = 'sekret-backend'/);
  assert.match(workerVerifier, /const alphaWorker = 'sekret-backend-alpha'/);
  assert.match(workerVerifier, /CLOUDFLARE_API_TOKEN/);
  assert.match(workerVerifier, /fallbackUsed/);
  assert.match(workerVerifier, /separateActiveTriggers\.length === 0/);
  assert.match(workerVerifier, /raw\.split\(accountId\)\.join\(':account'\)/);

  const initialReceiptIndex = workerVerifier.indexOf('writeReceipt();');
  const tokenVerifyIndex = workerVerifier.indexOf("await get('/user/tokens/verify')");
  assert.ok(initialReceiptIndex >= 0);
  assert.ok(tokenVerifyIndex > initialReceiptIndex);

  assert.doesNotMatch(workflow, /method:\s*['\"]?(?:PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(workflow, /\/cancel(?:\b|`|\$\{)/);
  assert.doesNotMatch(workflow, /deletedPreviewTriggers|cancelledNonMainBuilds/);
});

test('Cloudflare Worker authority verifier retains a sanitized blocked receipt on early provider failure', async () => {
  const originalFetch = globalThis.fetch;
  const envKeys = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN',
    'CLOUDFLARE_API_TOKEN',
    'EVIDENCE_PATH',
    'GITHUB_REF',
    'GITHUB_SHA',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const tempDir = await mkdtemp(join(tmpdir(), 'sekret-cloudflare-authority-'));
  const evidencePath = join(tempDir, 'receipt.json');

  process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
  process.env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN = 'test-token-secret';
  delete process.env.CLOUDFLARE_API_TOKEN;
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

test('Cloudflare Worker authority verifier falls back to the general token without retaining either secret', async () => {
  const originalFetch = globalThis.fetch;
  const envKeys = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN',
    'CLOUDFLARE_API_TOKEN',
    'EVIDENCE_PATH',
    'GITHUB_REF',
    'GITHUB_SHA',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const tempDir = await mkdtemp(join(tmpdir(), 'sekret-cloudflare-authority-fallback-'));
  const evidencePath = join(tempDir, 'receipt.json');
  const accountId = 'fallback-account';
  const staleToken = 'stale-dedicated-token';
  const fallback = 'active-general-token';
  const tags = {
    sekret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'sekret-backend': 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'sekret-backend-alpha': 'cccccccccccccccccccccccccccccccc',
  };

  process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
  process.env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN = staleToken;
  process.env.CLOUDFLARE_API_TOKEN = fallback;
  process.env.EVIDENCE_PATH = evidencePath;
  process.env.GITHUB_REF = 'refs/heads/main';
  process.env.GITHUB_SHA = '3333333333333333333333333333333333333333';

  globalThis.fetch = async (url, options = {}) => {
    const authToken = String(options.headers?.Authorization || '').replace(/^Bearer /, '');
    const text = String(url);
    if (text.endsWith('/user/tokens/verify')) {
      if (authToken === staleToken) {
        return { ok: false, status: 400, json: async () => ({ success: false }) };
      }
      assert.equal(authToken, fallback);
      return { ok: true, status: 200, json: async () => ({ success: true, result: { status: 'active' } }) };
    }

    assert.equal(authToken, fallback);
    if (text.includes(`/accounts/${accountId}/workers/scripts`)) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          result: Object.entries(tags).map(([id, tag]) => ({ id, tag })),
        }),
      };
    }
    if (text.endsWith(`/builds/workers/${tags.sekret}/triggers`)) {
      return { ok: true, status: 200, json: async () => ({ success: true, result: [] }) };
    }
    if (text.endsWith('/builds/workers/sekret/builds?per_page=50')) {
      return { ok: true, status: 200, json: async () => ({ success: true, result: [] }) };
    }
    if (text.endsWith(`/builds/workers/${tags['sekret-backend']}/triggers`)) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          result: [{
            trigger_uuid: 'prod-trigger',
            branch_includes: ['main'],
            branch_excludes: [],
            deploy_command: 'npm run deploy:api:production',
            build_command: '',
            deleted_on: null,
          }],
        }),
      };
    }
    if (text.endsWith('/builds/workers/sekret-backend/builds?per_page=50')) {
      return { ok: true, status: 200, json: async () => ({ success: true, result: [] }) };
    }
    if (text.endsWith(`/builds/workers/${tags['sekret-backend-alpha']}/triggers`)) {
      return { ok: true, status: 200, json: async () => ({ success: true, result: [] }) };
    }
    throw new Error(`Unexpected request: ${text}`);
  };

  let thrown;
  try {
    await import(`${workerVerifierUrl.href}?fallback-test=${Date.now()}`);
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
    assert.equal(thrown, undefined);
    const raw = await readFile(evidencePath, 'utf8');
    const receipt = JSON.parse(raw);
    assert.equal(receipt.status, 'verified');
    assert.equal(receipt.credential.selectedSource, 'CLOUDFLARE_API_TOKEN');
    assert.equal(receipt.credential.fallbackUsed, true);
    assert.equal(receipt.separateWorker.activeTriggerCount, 0);
    assert.equal(receipt.separateWorker.verifiedSafeBuildAuthority, true);
    assert.equal(receipt.productionWorker.verifiedMainOnly, true);
    assert.equal(receipt.workersAuthorityVerified, true);
    assert.equal(raw.includes(staleToken), false);
    assert.equal(raw.includes(fallback), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('Cloudflare Worker authority verifier redacts account IDs from scoped provider failure evidence', async () => {
  const originalFetch = globalThis.fetch;
  const envKeys = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN',
    'CLOUDFLARE_API_TOKEN',
    'EVIDENCE_PATH',
    'GITHUB_REF',
    'GITHUB_SHA',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const tempDir = await mkdtemp(join(tmpdir(), 'sekret-cloudflare-authority-account-'));
  const evidencePath = join(tempDir, 'receipt.json');
  const accountId = 'account-id-must-not-be-retained';

  process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
  process.env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN = 'scoped-test-token-secret';
  delete process.env.CLOUDFLARE_API_TOKEN;
  process.env.EVIDENCE_PATH = evidencePath;
  process.env.GITHUB_REF = 'refs/heads/main';
  process.env.GITHUB_SHA = '2222222222222222222222222222222222222222';
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/user/tokens/verify')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, result: { status: 'active' } }),
      };
    }
    if (String(url).includes(`/accounts/${accountId}/workers/scripts`)) {
      return {
        ok: false,
        status: 403,
        json: async () => ({ success: false, errors: [{ message: 'scoped-provider-body-must-not-be-retained' }] }),
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  let thrown;
  try {
    await import(`${workerVerifierUrl.href}?account-redaction-test=${Date.now()}`);
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
    assert.match(thrown.message, /GET \/accounts\/:account\/workers\/scripts\?per_page=100 failed with provider status 403/);

    const raw = await readFile(evidencePath, 'utf8');
    const receipt = JSON.parse(raw);
    assert.equal(receipt.status, 'blocked');
    assert.equal(receipt.failure?.code, 'provider-http-failure');
    assert.equal(receipt.failure?.providerPath, '/accounts/:account/workers/scripts?per_page=100');
    assert.equal(receipt.failure?.providerStatus, 403);
    assert.equal(raw.includes(accountId), false);
    assert.equal(raw.includes('scoped-test-token-secret'), false);
    assert.equal(raw.includes('scoped-provider-body-must-not-be-retained'), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
