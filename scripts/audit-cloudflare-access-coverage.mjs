import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API_BASE = 'https://api.cloudflare.com/client/v4';
export const DEFAULT_EVIDENCE_PATH = 'artifacts/cloudflare-access-coverage.json';
export const DEFAULT_TARGET_HOSTS = Object.freeze([
  'app.sekretbip.net',
  'api.sekretbip.net',
]);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function tokenCandidatesFromEnv(env) {
  const candidates = [
    ['CLOUDFLARE_ACCESS_API_TOKEN', clean(env.CLOUDFLARE_ACCESS_API_TOKEN)],
    ['CLOUDFLARE_API_TOKEN', clean(env.CLOUDFLARE_API_TOKEN)],
    ['CLOUDFLARE_WORKERS_BUILDS_API_TOKEN', clean(env.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN)],
  ]
    .filter(([, token]) => token)
    .map(([source, token]) => ({ source, token }));

  return candidates.filter(
    (candidate, index) => candidates.findIndex((other) => other.token === candidate.token) === index,
  );
}

function providerError(payload, fallback = 'Cloudflare request failed') {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return {
    codes: errors
      .map((item) => item?.code)
      .filter((code) => Number.isInteger(code)),
    messages: errors
      .map((item) => clean(item?.message))
      .filter(Boolean)
      .slice(0, 5),
    fallback: clean(fallback) || 'Cloudflare request failed',
  };
}

async function requestJson({ accountId, token }, requestPath, fetchImpl) {
  const response = await fetchImpl(`${API_BASE}${requestPath}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const detail = providerError(payload, response.statusText);
    const error = new Error(
      `Cloudflare GET ${requestPath} failed (${response.status}): ${detail.messages.join('; ') || detail.fallback}`,
    );
    error.providerStatus = response.status;
    error.providerCodes = detail.codes;
    throw error;
  }
  return payload;
}

function hostnameFromValue(value) {
  const raw = clean(value);
  if (!raw) return '';
  const withoutWildcard = raw.replace(/^\*\./, 'wildcard.');
  try {
    const url = new URL(withoutWildcard.includes('://') ? withoutWildcard : `https://${withoutWildcard}`);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'wildcard.' ? '*.' : hostname.replace(/^wildcard\./, '*.');
  } catch {
    return raw.toLowerCase().split('/')[0];
  }
}

function hostnameMatches(pattern, target) {
  const normalizedPattern = hostnameFromValue(pattern);
  const normalizedTarget = hostnameFromValue(target);
  if (!normalizedPattern || !normalizedTarget) return false;
  if (normalizedPattern === normalizedTarget) return true;
  if (normalizedPattern.startsWith('*.')) {
    const suffix = normalizedPattern.slice(1);
    return normalizedTarget.endsWith(suffix) && normalizedTarget !== suffix.slice(1);
  }
  return false;
}

function destinationHost(destination) {
  return hostnameFromValue(destination?.hostname || destination?.uri || '');
}

function applicationReasons(app, target) {
  const reasons = [];
  if (hostnameMatches(app?.domain, target)) reasons.push('domain');
  for (const domain of Array.isArray(app?.self_hosted_domains) ? app.self_hosted_domains : []) {
    if (hostnameMatches(domain, target)) reasons.push('self-hosted-domain');
  }

  for (const destination of Array.isArray(app?.destinations) ? app.destinations : []) {
    const type = clean(destination?.type).toLowerCase();
    if (type === 'all_workers') reasons.push('all-workers');
    if (type === 'worker') reasons.push('worker-routing-dependent');
    if (type === 'public' && hostnameMatches(destinationHost(destination), target)) {
      reasons.push('public-destination');
    }
  }
  return unique(reasons);
}

function selectorKinds(rules) {
  if (!Array.isArray(rules)) return [];
  return unique(
    rules.flatMap((rule) => (rule && typeof rule === 'object' ? Object.keys(rule) : [])),
  ).sort();
}

function publicPolicy(policy) {
  return {
    id: clean(policy?.id) || null,
    name: clean(policy?.name) || null,
    decision: clean(policy?.decision) || null,
    precedence: Number.isInteger(policy?.precedence) ? policy.precedence : null,
    includeSelectors: selectorKinds(policy?.include),
    requireSelectors: selectorKinds(policy?.require),
    excludeSelectors: selectorKinds(policy?.exclude),
  };
}

function publicApplication(app, reasons, policies, policyReadError = null) {
  return {
    id: clean(app?.id) || null,
    name: clean(app?.name) || null,
    type: clean(app?.type) || null,
    domain: clean(app?.domain) || null,
    destinationTypes: unique(
      (Array.isArray(app?.destinations) ? app.destinations : [])
        .map((destination) => clean(destination?.type).toLowerCase()),
    ),
    reasons,
    policies,
    policyReadError,
  };
}

async function listApplications(config, fetchImpl) {
  const payload = await requestJson(
    config,
    `/accounts/${config.accountId}/access/apps?per_page=1000`,
    fetchImpl,
  );
  return Array.isArray(payload?.result) ? payload.result : [];
}

async function listPolicies(config, appId, fetchImpl) {
  const payload = await requestJson(
    config,
    `/accounts/${config.accountId}/access/apps/${encodeURIComponent(appId)}/policies?per_page=1000`,
    fetchImpl,
  );
  return (Array.isArray(payload?.result) ? payload.result : []).map(publicPolicy);
}

async function writeEvidence(evidencePath, receipt) {
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
}

function errorReceipt(error, source) {
  return {
    source,
    status: Number.isInteger(error?.providerStatus) ? error.providerStatus : null,
    providerCodes: Array.isArray(error?.providerCodes) ? error.providerCodes : [],
    error: error instanceof Error ? error.message : String(error),
  };
}

export async function auditCloudflareAccessCoverage({
  env = process.env,
  fetchImpl = fetch,
  now = () => new Date(),
  evidencePath = clean(env.CLOUDFLARE_ACCESS_EVIDENCE_PATH) || DEFAULT_EVIDENCE_PATH,
  targetHosts = clean(env.CLOUDFLARE_ACCESS_TARGET_HOSTS)
    ? clean(env.CLOUDFLARE_ACCESS_TARGET_HOSTS).split(',').map((item) => clean(item).toLowerCase()).filter(Boolean)
    : [...DEFAULT_TARGET_HOSTS],
} = {}) {
  const accountId = clean(env.CLOUDFLARE_ACCOUNT_ID);
  const candidates = tokenCandidatesFromEnv(env);
  const baseReceipt = {
    version: 1,
    generatedAt: now().toISOString(),
    mutationPerformed: false,
    accountIdConfigured: Boolean(accountId),
    targets: targetHosts,
    credential: {
      candidateSources: candidates.map((candidate) => candidate.source),
      selectedSource: null,
      failures: [],
    },
    coverage: [],
  };

  if (!accountId || candidates.length === 0) {
    const receipt = {
      ...baseReceipt,
      status: 'configuration-missing',
      error: !accountId
        ? 'CLOUDFLARE_ACCOUNT_ID is required.'
        : 'At least one Cloudflare API token candidate is required.',
    };
    await writeEvidence(evidencePath, receipt);
    throw new Error(receipt.error);
  }

  let providerConfig = null;
  let applications = null;
  for (const candidate of candidates) {
    const config = { accountId, token: candidate.token };
    try {
      applications = await listApplications(config, fetchImpl);
      providerConfig = { ...config, source: candidate.source };
      break;
    } catch (error) {
      baseReceipt.credential.failures.push(errorReceipt(error, candidate.source));
    }
  }

  if (!providerConfig || !applications) {
    const receipt = {
      ...baseReceipt,
      status: 'provider-read-failed',
      error: 'No configured Cloudflare token could list Access applications.',
    };
    await writeEvidence(evidencePath, receipt);
    throw new Error(receipt.error);
  }

  baseReceipt.credential.selectedSource = providerConfig.source;
  const coverage = [];
  for (const target of targetHosts) {
    const matchingApplications = [];
    for (const app of applications) {
      const reasons = applicationReasons(app, target);
      if (reasons.length === 0) continue;

      let policies = [];
      let policyReadError = null;
      const appId = clean(app?.id);
      if (appId) {
        try {
          policies = await listPolicies(providerConfig, appId, fetchImpl);
        } catch (error) {
          policyReadError = errorReceipt(error, providerConfig.source);
        }
      }
      matchingApplications.push(publicApplication(app, reasons, policies, policyReadError));
    }
    coverage.push({ hostname: target, matchingApplications });
  }

  const receipt = {
    ...baseReceipt,
    status: 'audited',
    applicationCountObserved: applications.length,
    coverage,
  };
  await writeEvidence(evidencePath, receipt);
  console.log(
    `CLOUDFLARE_ACCESS_AUDIT_COMPLETE targets=${coverage.length} matched=${coverage.reduce((sum, item) => sum + item.matchingApplications.length, 0)} credential=${providerConfig.source}`,
  );
  return receipt;
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  auditCloudflareAccessCoverage().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
