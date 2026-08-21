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
  schemaVersion: 6,
  generatedAt: new Date().toISOString(),
  trustedGitRef: process.env.GITHUB_REF || null,
  trustedGitSha: process.env.GITHUB_SHA || null,
  mode: 'read-only',
  mutationPerformed: false,
  status: 'started',
  failure: null,
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

async function get(providerPath) {
  let response;
  try {
    response = await fetch(`${API}${providerPath}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch {
    fail('provider-request-failed', `GET ${providerPath} failed before provider response`, {
      providerPath,
    });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    fail('provider-http-failure', `GET ${providerPath} failed with provider status ${response.status}`, {
      providerPath,
      providerStatus: response.status,
    });
  }
  return payload?.result;
}

writeReceipt();
if (!accountId) fail('configuration-missing', 'CLOUDFLARE_ACCOUNT_ID is required.', { field: 'CLOUDFLARE_ACCOUNT_ID' });
if (!token) fail('configuration-missing', 'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN is required.', { field: 'CLOUDFLARE_WORKERS_BUILDS_API_TOKEN' });

const tokenState = await get('/user/tokens/verify');
if (tokenState?.status !== 'active') {
  fail('provider-token-inactive', 'Dedicated Workers Builds API token is not active.', {
    providerPath: '/user/tokens/verify',
  });
}

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
