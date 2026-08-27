import fs from 'node:fs';
import path from 'node:path';

const API = 'https://api.cloudflare.com/client/v4';
const clean = (value) => String(value ?? '').trim();
const accountId = clean(process.env.CLOUDFLARE_ACCOUNT_ID);
const token = clean(process.env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN);
const evidencePath = clean(process.env.EVIDENCE_PATH) || 'artifacts/cloudflare-worker-branch-authority.json';
const separateWorker = 'sekret';
const productionWorker = 'sekret-backend';
const alphaWorker = 'sekret-backend-alpha';
const pagesProject = 'sekret-bip';
const terminal = new Set(['success', 'fail', 'skipped', 'cancelled', 'terminated']);
const active = (rows) => (Array.isArray(rows) ? rows : []).filter((row) => !row?.deleted_on);

const receipt = {
  schemaVersion: 7,
  generatedAt: new Date().toISOString(),
  trustedGitRef: process.env.GITHUB_REF || null,
  trustedGitSha: process.env.GITHUB_SHA || null,
  mode: 'read-only',
  mutationPerformed: false,
  status: 'started',
  failure: null,
  credentialVerification: {
    ownerType: null,
    userProviderStatus: null,
    accountProviderStatus: null,
  },
  providerTopology: {
    workers: [
      { name: separateWorker, role: 'separate-protected', mutationAuthorized: false },
      { name: productionWorker, role: 'production' },
      { name: alphaWorker, role: 'founder-gated-alpha', mutationAuthorized: false },
    ],
    pages: [{ name: pagesProject, role: 'frontend', mutationAuthorized: false }],
  },
  separateWorker: {
    name: separateWorker,
    scriptTag: null,
    mutationAuthorized: false,
    bindingAuthority: 'provider-readback-required',
  },
  productionWorker: {
    name: productionWorker,
    scriptTag: null,
    activeTriggerCount: null,
    branchIncludes: [],
    branchExcludes: [],
    deployCommand: null,
    buildCommand: null,
    activeNonMainBuildCount: null,
    verifiedMainOnly: false,
  },
  alphaWorker: {
    name: alphaWorker,
    scriptTag: null,
    activeTriggerCount: null,
    founderGatedObservationOnly: true,
  },
  pagesProject: {
    name: pagesProject,
    verification: 'load-bearing-provider-readback',
    mutationAuthorized: false,
  },
  separateWorkerObserved: false,
  workersAuthorityVerified: false,
};

function writeReceipt() {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  receipt.updatedAt = new Date().toISOString();
  fs.writeFileSync(evidencePath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
}

function publicProviderPath(providerPath) {
  const raw = clean(providerPath);
  if (!raw) return null;
  return accountId ? raw.split(accountId).join(':account') : raw;
}

function fail(code, message, details = {}) {
  receipt.status = 'blocked';
  receipt.failure = {
    code,
    message,
    ...details,
  };
  writeReceipt();
  throw new Error(message);
}

async function requestProvider(providerPath) {
  const retainedProviderPath = publicProviderPath(providerPath);
  let response;
  try {
    response = await fetch(`${API}${providerPath}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch {
    return {
      ok: false,
      providerPath: retainedProviderPath,
      providerStatus: null,
      result: null,
    };
  }

  const payload = await response.json().catch(() => null);
  return {
    ok: response.ok && payload?.success !== false,
    providerPath: retainedProviderPath,
    providerStatus: response.status,
    result: payload?.result ?? null,
  };
}

async function get(providerPath) {
  const attempt = await requestProvider(providerPath);
  if (!attempt.ok) {
    if (attempt.providerStatus == null) {
      fail('provider-request-failed', `GET ${attempt.providerPath} failed before provider response`, {
        providerPath: attempt.providerPath,
      });
    }
    fail('provider-http-failure', `GET ${attempt.providerPath} failed with provider status ${attempt.providerStatus}`, {
      providerPath: attempt.providerPath,
      providerStatus: attempt.providerStatus,
    });
  }
  return attempt.result;
}

async function verifyTokenOwnership() {
  const userAttempt = await requestProvider('/user/tokens/verify');
  receipt.credentialVerification.userProviderStatus = userAttempt.providerStatus;

  if (userAttempt.ok && userAttempt.result?.status === 'active') {
    receipt.credentialVerification.ownerType = 'user';
    writeReceipt();
    return;
  }

  const accountAttempt = await requestProvider(`/accounts/${accountId}/tokens/verify`);
  receipt.credentialVerification.accountProviderStatus = accountAttempt.providerStatus;

  if (accountAttempt.ok && accountAttempt.result?.status === 'active') {
    receipt.credentialVerification.ownerType = 'account';
    writeReceipt();
    return;
  }

  fail(
    'provider-token-verification-failed',
    'Dedicated Workers Builds API token could not be verified as an active user-owned or account-owned token.',
    {
      userProviderStatus: userAttempt.providerStatus,
      accountProviderStatus: accountAttempt.providerStatus,
    },
  );
}

writeReceipt();
if (!accountId) fail('configuration-missing', 'CLOUDFLARE_ACCOUNT_ID is required.', { field: 'CLOUDFLARE_ACCOUNT_ID' });
if (!token) fail('configuration-missing', 'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN is required.', { field: 'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN' });

await verifyTokenOwnership();

const scripts = await get(`/accounts/${accountId}/workers/scripts?per_page=100`);
const findWorker = (name) => (Array.isArray(scripts) ? scripts : []).filter((row) => clean(row?.id) === name);
const separateMatches = findWorker(separateWorker);
const productionMatches = findWorker(productionWorker);
const alphaMatches = findWorker(alphaWorker);
if (separateMatches.length !== 1) fail('worker-identity-mismatch', `${separateWorker}: expected exactly one Worker, found ${separateMatches.length}.`, { worker: separateWorker, observedCount: separateMatches.length });
if (productionMatches.length !== 1) fail('worker-identity-mismatch', `${productionWorker}: expected exactly one Worker, found ${productionMatches.length}.`, { worker: productionWorker, observedCount: productionMatches.length });
if (alphaMatches.length !== 1) fail('worker-identity-mismatch', `${alphaWorker}: expected exactly one Worker, found ${alphaMatches.length}.`, { worker: alphaWorker, observedCount: alphaMatches.length });

const separateTag = clean(separateMatches[0]?.tag);
const productionTag = clean(productionMatches[0]?.tag);
const alphaTag = clean(alphaMatches[0]?.tag);
if (!separateTag || !productionTag || !alphaTag) {
  fail('worker-tag-missing', 'All protected Worker identities must expose immutable script tags.');
}

receipt.separateWorker.scriptTag = separateTag;
receipt.separateWorkerObserved = true;
receipt.productionWorker.scriptTag = productionTag;
receipt.alphaWorker.scriptTag = alphaTag;
writeReceipt();

const triggerRows = await get(`/accounts/${accountId}/builds/workers/${productionTag}/triggers`);
const buildRows = await get(`/accounts/${accountId}/builds/workers/${productionWorker}/builds?per_page=50`);
const activeTriggers = active(triggerRows);
const productionTrigger = activeTriggers.length === 1 ? activeTriggers[0] : null;
const includes = Array.isArray(productionTrigger?.branch_includes) ? productionTrigger.branch_includes.map(clean) : [];
const excludes = Array.isArray(productionTrigger?.branch_excludes) ? productionTrigger.branch_excludes.map(clean) : [];
const deployCommand = clean(productionTrigger?.deploy_command);
const buildCommand = clean(productionTrigger?.build_command);
const activeNonMainBuilds = (Array.isArray(buildRows) ? buildRows : []).filter((build) => {
  const branch = clean(build?.build_trigger_metadata?.branch);
  const outcome = clean(build?.build_outcome).toLowerCase();
  return branch && branch !== 'main' && !terminal.has(outcome);
});
const verifiedMainOnly = activeTriggers.length === 1 &&
  JSON.stringify(includes) === JSON.stringify(['main']) &&
  excludes.length === 0 &&
  deployCommand === 'npm run deploy:api:production' &&
  buildCommand === '' &&
  activeNonMainBuilds.length === 0;
const alphaTriggers = await get(`/accounts/${accountId}/builds/workers/${alphaTag}/triggers`);

receipt.productionWorker.activeTriggerCount = activeTriggers.length;
receipt.productionWorker.branchIncludes = includes;
receipt.productionWorker.branchExcludes = excludes;
receipt.productionWorker.deployCommand = deployCommand;
receipt.productionWorker.buildCommand = buildCommand;
receipt.productionWorker.activeNonMainBuildCount = activeNonMainBuilds.length;
receipt.productionWorker.verifiedMainOnly = verifiedMainOnly;
receipt.alphaWorker.activeTriggerCount = active(alphaTriggers).length;
receipt.workersAuthorityVerified = verifiedMainOnly;

if (!verifiedMainOnly) {
  fail('production-worker-branch-authority-not-verified', 'CLOUDFLARE_PRODUCTION_WORKER_BRANCH_AUTHORITY_NOT_VERIFIED');
}

receipt.status = 'verified';
receipt.failure = null;
writeReceipt();
console.log('CLOUDFLARE_PROTECTED_WORKER_TOPOLOGY_VERIFIED_READ_ONLY');
