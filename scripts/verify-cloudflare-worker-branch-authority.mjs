import fs from 'node:fs';

const API = 'https://api.cloudflare.com/client/v4';
const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const token = String(process.env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN || '').trim();
const separateWorker = 'sekret';
const productionWorker = 'sekret-backend';
const alphaWorker = 'sekret-backend-alpha';
const pagesProject = 'sekret-bip';
const terminal = new Set(['success', 'fail', 'skipped', 'cancelled', 'terminated']);
const clean = (value) => String(value ?? '').trim();
const active = (rows) => (Array.isArray(rows) ? rows : []).filter((row) => !row?.deleted_on);
const evidencePath = process.env.EVIDENCE_PATH;

const receipt = {
  schemaVersion: 6,
  generatedAt: new Date().toISOString(),
  trustedGitRef: process.env.GITHUB_REF || null,
  trustedGitSha: process.env.GITHUB_SHA || null,
  mode: 'read-only',
  mutationPerformed: false,
  verificationStatus: 'started',
  failure: null,
  providerTopology: {
    workers: [
      { name: separateWorker, role: 'separate-protected', mutationAuthorized: false },
      { name: productionWorker, role: 'production' },
      { name: alphaWorker, role: 'founder-gated-alpha', mutationAuthorized: false },
    ],
    pages: [{ name: pagesProject, role: 'frontend', mutationAuthorized: false }],
  },
};

function writeReceipt() {
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
}

function fail(stage, error) {
  receipt.generatedAt = new Date().toISOString();
  receipt.verificationStatus = 'failed';
  receipt.failure = {
    stage,
    classification: 'provider-read-failed',
    message: clean(error?.message || error),
  };
  writeReceipt();
  console.error(`CLOUDFLARE_WORKER_BRANCH_AUTHORITY_FAILED:${stage}`);
  process.exit(1);
}

async function get(path, stage) {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      throw new Error(`GET ${path} failed with provider status ${response.status}`);
    }
    return payload?.result;
  } catch (error) {
    fail(stage, error);
  }
}

if (!evidencePath) throw new Error('EVIDENCE_PATH is required.');
writeReceipt();
if (!accountId) fail('configuration', new Error('CLOUDFLARE_ACCOUNT_ID is required.'));
if (!token) fail('configuration', new Error('CLOUDFLARE_WORKERS_BUILDS_API_TOKEN is required.'));

const tokenState = await get('/user/tokens/verify', 'token-verification');
if (tokenState?.status !== 'active') fail('token-verification', new Error('Dedicated Workers Builds API token is not active.'));
const scripts = await get(`/accounts/${accountId}/workers/scripts?per_page=100`, 'worker-topology');
const findWorker = (name) => (Array.isArray(scripts) ? scripts : []).filter((row) => clean(row?.id) === name);
const separateMatches = findWorker(separateWorker);
const productionMatches = findWorker(productionWorker);
const alphaMatches = findWorker(alphaWorker);
if (separateMatches.length !== 1) fail('worker-topology', new Error(`${separateWorker}: expected exactly one Worker, found ${separateMatches.length}.`));
if (productionMatches.length !== 1) fail('worker-topology', new Error(`${productionWorker}: expected exactly one Worker, found ${productionMatches.length}.`));
if (alphaMatches.length !== 1) fail('worker-topology', new Error(`${alphaWorker}: expected exactly one Worker, found ${alphaMatches.length}.`));
const separateTag = clean(separateMatches[0]?.tag);
const productionTag = clean(productionMatches[0]?.tag);
const alphaTag = clean(alphaMatches[0]?.tag);
if (!separateTag || !productionTag || !alphaTag) fail('worker-topology', new Error('All protected Worker identities must expose immutable script tags.'));
const triggerRows = await get(`/accounts/${accountId}/builds/workers/${productionTag}/triggers`, 'production-trigger-read');
const buildRows = await get(`/accounts/${accountId}/builds/workers/${productionWorker}/builds?per_page=50`, 'production-build-read');
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
const alphaTriggers = await get(`/accounts/${accountId}/builds/workers/${alphaTag}/triggers`, 'alpha-trigger-read');
Object.assign(receipt, {
  generatedAt: new Date().toISOString(),
  verificationStatus: verifiedMainOnly ? 'verified' : 'failed',
  failure: verifiedMainOnly ? null : {
    stage: 'production-branch-authority',
    classification: 'authority-contract-not-verified',
    message: 'Production Worker branch authority did not match the required main-only contract.',
  },
  separateWorker: {
    name: separateWorker,
    scriptTag: separateTag,
    mutationAuthorized: false,
    bindingAuthority: 'provider-readback-required',
  },
  productionWorker: {
    name: productionWorker,
    scriptTag: productionTag,
    activeTriggerCount: activeTriggers.length,
    branchIncludes: includes,
    branchExcludes: excludes,
    deployCommand,
    buildCommand,
    activeNonMainBuildCount: activeNonMainBuilds.length,
    verifiedMainOnly,
  },
  alphaWorker: {
    name: alphaWorker,
    scriptTag: alphaTag,
    activeTriggerCount: active(alphaTriggers).length,
    founderGatedObservationOnly: true,
  },
  pagesProject: {
    name: pagesProject,
    verification: 'load-bearing-provider-readback',
    mutationAuthorized: false,
  },
  separateWorkerObserved: true,
  workersAuthorityVerified: verifiedMainOnly,
});
writeReceipt();
if (!verifiedMainOnly) {
  console.error('CLOUDFLARE_PRODUCTION_WORKER_BRANCH_AUTHORITY_NOT_VERIFIED');
  process.exit(1);
}
console.log('CLOUDFLARE_PROTECTED_WORKER_TOPOLOGY_VERIFIED_READ_ONLY');
