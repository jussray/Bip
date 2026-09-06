import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { main as reconcileMain } from './reconcile-cloudflare-app-domain.mjs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const EVIDENCE_PATH = 'artifacts/cloudflare-app-domain-routing-evidence.json';
const PROTECTED_WORKERS = ['sekret-backend', 'sekret-backend-alpha'];

function inputUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return typeof input?.url === 'string' ? input.url : '';
}

export function classifyObservedRequest(input, init = {}) {
  const rawUrl = inputUrl(input);
  const method = String(init?.method || 'GET').toUpperCase();
  let url = null;
  try {
    url = new URL(rawUrl);
  } catch {
    return { provider: 'unknown', operation: 'unknown-request', method };
  }

  if (url.hostname === 'api.cloudflare.com') {
    const path = url.pathname;
    if (method === 'DELETE' && path.includes('/workers/domains/')) {
      return { provider: 'cloudflare', operation: 'worker-domain-delete', method };
    }
    if (method === 'DELETE' && path.includes('/workers/routes/')) {
      return { provider: 'cloudflare', operation: 'worker-route-delete', method };
    }
    if (path.includes('/pages/projects/') && path.endsWith('/domains')) {
      return { provider: 'cloudflare', operation: 'pages-domains-read', method };
    }
    if (path.endsWith('/workers/scripts')) {
      return { provider: 'cloudflare', operation: 'worker-scripts-read', method };
    }
    if (path.endsWith('/workers/domains')) {
      return { provider: 'cloudflare', operation: 'worker-domains-read', method };
    }
    if (path.endsWith('/workers/routes')) {
      return { provider: 'cloudflare', operation: 'worker-routes-read', method };
    }
    if (/\/client\/v4\/zones\/[^/]+$/.test(path)) {
      return { provider: 'cloudflare', operation: 'zone-read', method };
    }
    if (path === '/client/v4/zones') {
      return { provider: 'cloudflare', operation: 'zone-search', method };
    }
    return { provider: 'cloudflare', operation: 'cloudflare-request', method };
  }

  if (url.hostname === 'app.sekretbip.net') {
    return { provider: 'runtime', operation: 'app-runtime-probe', method };
  }
  if (url.hostname === 'api.sekretbip.net') {
    return { provider: 'runtime', operation: 'backend-health-probe', method };
  }

  return { provider: 'external', operation: 'external-request', method };
}

export function twoWorkerTopologyMatches(workerIds = []) {
  const observed = new Set(
    (Array.isArray(workerIds) ? workerIds : [])
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  );
  return PROTECTED_WORKERS.every((worker) => observed.has(worker));
}

export function appDomainApplyBlockReason(argv = [], topologyVerified = false) {
  if (!argv.includes('--apply')) return null;
  return topologyVerified ? null : 'TWO_WORKER_TOPOLOGY_PROVIDER_READBACK_REQUIRED';
}

function numericProviderCodes(payload) {
  return (payload?.errors || [])
    .map((item) => item?.code)
    .filter((code) => Number.isInteger(code));
}

async function verifyTwoWorkerTopology(env = process.env) {
  const token = String(env.CLOUDFLARE_API_TOKEN || '').trim();
  const accountId = String(env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  if (!token || !accountId) {
    throw new Error('TWO_WORKER_TOPOLOGY_PROVIDER_READBACK_CONFIGURATION_MISSING');
  }

  const response = await fetch(
    `${API_BASE}/accounts/${encodeURIComponent(accountId)}/workers/scripts?per_page=100`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error('TWO_WORKER_TOPOLOGY_PROVIDER_READBACK_FAILED');
  }

  const workerIds = (Array.isArray(payload?.result) ? payload.result : [])
    .map((worker) => String(worker?.id || '').trim())
    .filter(Boolean);
  if (!twoWorkerTopologyMatches(workerIds)) {
    throw new Error('TWO_WORKER_TOPOLOGY_MISMATCH');
  }

  console.log('TWO_WORKER_TOPOLOGY_PROVIDER_READBACK_VERIFIED');
  return {
    verified: true,
    protectedWorkers: [...PROTECTED_WORKERS],
  };
}

async function readExistingEvidence() {
  try {
    return JSON.parse(await readFile(EVIDENCE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function writeFailureReceipt(existing, observation, env = process.env) {
  const actions = Array.isArray(existing?.actions) ? existing.actions : [];
  const hadExistingReceipt = Boolean(existing);
  const phase =
    actions.length > 0
      ? 'apply-failed'
      : hadExistingReceipt
        ? 'preflight-failed-after-receipt'
        : 'preflight-failed-before-mutation';
  const mutationState =
    actions.length > 0 ? 'confirmed' : hadExistingReceipt ? 'none-confirmed' : 'not-reachable';

  const base = existing || {
    zone: env.BIP_APP_ZONE || 'sekretbip.net',
    hostname: env.BIP_APP_HOSTNAME || 'app.sekretbip.net',
    pagesProject: env.BIP_APP_PAGES_PROJECT || 'sekret-bip',
    backendWorker: env.BIP_APP_BACKEND_WORKER || 'sekret-backend',
    protectedWorkers: PROTECTED_WORKERS,
    topologyAuthority: 'provider-readback-required',
    actions: [],
  };

  await mkdir('artifacts', { recursive: true });
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(
      {
        ...base,
        schemaVersion: 3,
        generatedAt: new Date().toISOString(),
        phase,
        mutationState,
        failure: observation,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  console.log(`FAILURE_EVIDENCE_WRITTEN path=${EVIDENCE_PATH} phase=${phase}`);
}

async function persistVerifiedTopology(topology) {
  const existing = await readExistingEvidence();
  if (!existing) return;
  await writeFile(
    EVIDENCE_PATH,
    `${JSON.stringify(
      {
        ...existing,
        protectedWorkers: topology.protectedWorkers,
        topologyAuthority: 'provider-readback-verified',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

export async function run(argv = process.argv.slice(2), env = process.env) {
  const originalFetch = globalThis.fetch;
  let observation = {
    provider: 'none',
    operation: 'startup',
    method: null,
    status: null,
    providerCodes: [],
  };

  globalThis.fetch = async (input, init = {}) => {
    const classified = classifyObservedRequest(input, init);
    observation = { ...classified, status: null, providerCodes: [] };

    const response = await originalFetch(input, init);
    let providerCodes = [];
    if (classified.provider === 'cloudflare') {
      try {
        providerCodes = numericProviderCodes(await response.clone().json());
      } catch {
        providerCodes = [];
      }
    }

    observation = {
      ...classified,
      status: response.status,
      providerCodes,
    };
    return response;
  };

  try {
    let topology = null;
    if (argv.includes('--apply')) {
      topology = await verifyTwoWorkerTopology(env);
      const blockedReason = appDomainApplyBlockReason(argv, topology?.verified === true);
      if (blockedReason) throw new Error(blockedReason);
    }

    const result = await reconcileMain(argv, env);
    if (topology) await persistVerifiedTopology(topology);
    return result;
  } catch (error) {
    const existing = await readExistingEvidence();
    try {
      await writeFailureReceipt(existing, observation, env);
    } catch {
      console.error('CLOUDFLARE_APP_DOMAIN_FAILURE_RECEIPT_WRITE_FAILED');
    }
    throw error;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  run().catch(() => {
    console.error('CLOUDFLARE_APP_DOMAIN_RECONCILIATION_FAILED');
    process.exitCode = 1;
  });
}
