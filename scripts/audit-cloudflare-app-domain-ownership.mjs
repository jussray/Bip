import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import {
  appProbeIsFrontend,
  classifyWorkerBindings,
  configFromEnv,
  isCloudflareAccessUrl,
  validateResolvedZone,
} from './reconcile-cloudflare-app-domain.mjs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const EVIDENCE_PATH = 'artifacts/cloudflare-app-domain-ownership-inspection.json';

function providerError(payload, fallback) {
  const errors = (payload?.errors || [])
    .map((item) => `${item?.code ?? ''} ${item?.message ?? ''}`.trim())
    .filter(Boolean);
  return errors.length ? errors.join('; ') : fallback;
}

async function cfGet(config, path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(`Cloudflare GET ${path} failed: ${providerError(payload, response.statusText)}`);
  }
  return payload;
}

async function resolveZone(config) {
  if (config.zoneId) {
    const payload = await cfGet(config, `/zones/${config.zoneId}`);
    return validateResolvedZone(config, payload?.result);
  }

  const payload = await cfGet(
    config,
    `/zones?name=${encodeURIComponent(config.zoneName)}&status=active&per_page=50`,
  );
  const zone = payload?.result?.find((candidate) => candidate?.name === config.zoneName);
  if (!zone) throw new Error('ZONE_NOT_FOUND');
  return validateResolvedZone(config, zone);
}

async function probeApp(url) {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const body = await response.text();
  const probe = {
    url,
    requestedUrl: url,
    finalUrl: response.url || url,
    redirected: response.redirected === true,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    bodyFingerprint: body.replace(/[\r\n]+/g, '').slice(0, 240),
    bodySha256: createHash('sha256').update(body).digest('hex'),
  };
  return {
    ...probe,
    accessIntercepted: isCloudflareAccessUrl(probe.finalUrl),
    frontendLike: appProbeIsFrontend(probe),
  };
}

function summarizeRuntime(runtime) {
  return {
    url: runtime.url,
    requestedUrl: runtime.requestedUrl,
    finalUrl: runtime.finalUrl,
    redirected: runtime.redirected,
    status: runtime.status,
    contentType: runtime.contentType,
    bodySha256: runtime.bodySha256,
    accessIntercepted: runtime.accessIntercepted,
    frontendLike: runtime.frontendLike,
  };
}

async function probeBackend(url, expectedWorker) {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }
  return {
    url,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    healthy: response.status >= 200 && response.status < 300 && payload?.ok === true && payload?.worker === expectedWorker,
    worker: payload?.worker || null,
    releaseSha: payload?.releaseSha || payload?.release_sha || null,
  };
}

function summarizeDomain(domain) {
  return {
    id: domain?.id || null,
    hostname: domain?.hostname || null,
    service: domain?.service || null,
    zoneId: domain?.zone_id || null,
  };
}

function summarizeRoute(route) {
  return {
    id: route?.id || null,
    pattern: route?.pattern || null,
    script: route?.script || null,
  };
}

export function classifyAuditDecision({ pagesActive, classification, runtime, backendHealthy }) {
  if (!pagesActive) return 'pages-domain-not-active';
  if (!backendHealthy) return 'backend-health-regressed';
  if (runtime?.accessIntercepted) return 'access-policy-review';
  if (runtime?.frontendLike) return 'no-route-repair-needed';
  if (classification?.foreignDomains?.length || classification?.foreignExactRoutes?.length || classification?.broadRoutes?.length) {
    return 'manual-provider-review';
  }
  if (classification?.ownedDomains?.length || classification?.ownedExactRoutes?.length) {
    return 'bounded-sekret-backend-app-binding-candidate';
  }
  return 'interceptor-unexplained';
}

export async function auditCloudflareAppDomainOwnership(env = process.env) {
  const config = configFromEnv(env);
  if (!config.token) throw new Error('CLOUDFLARE_API_TOKEN_MISSING');

  const resolved = await resolveZone(config);
  const [pagesPayload, domainsPayload, routesPayload, runtime, backend] = await Promise.all([
    cfGet(resolved, `/accounts/${resolved.accountId}/pages/projects/${encodeURIComponent(resolved.pagesProject)}/domains`),
    cfGet(resolved, `/accounts/${resolved.accountId}/workers/domains?hostname=${encodeURIComponent(resolved.hostname)}`),
    cfGet(resolved, `/zones/${resolved.zoneId}/workers/routes`),
    probeApp(resolved.appUrl),
    probeBackend(resolved.apiHealthUrl, resolved.workerName),
  ]);

  const pagesDomains = pagesPayload?.result || [];
  const workerDomains = domainsPayload?.result || [];
  const workerRoutes = routesPayload?.result || [];
  const pagesDomain = pagesDomains.find(
    (domain) => String(domain?.name || '').toLowerCase() === resolved.hostname.toLowerCase(),
  ) || null;
  const classification = classifyWorkerBindings(
    { domains: workerDomains, routes: workerRoutes },
    resolved,
  );
  const pagesActive = pagesDomain?.status === 'active';
  const decision = classifyAuditDecision({
    pagesActive,
    classification,
    runtime,
    backendHealthy: backend.healthy,
  });

  const evidence = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    phase: 'read-only-inspection',
    mutationAttempted: false,
    target: {
      zone: resolved.zoneName,
      hostname: resolved.hostname,
      pagesProject: resolved.pagesProject,
      backendWorker: resolved.workerName,
    },
    pagesDomain: pagesDomain
      ? { id: pagesDomain.id || pagesDomain.domain_id || null, name: pagesDomain.name || null, status: pagesDomain.status || null }
      : null,
    bindings: {
      ownedDomains: classification.ownedDomains.map(summarizeDomain),
      foreignDomains: classification.foreignDomains.map(summarizeDomain),
      ownedExactRoutes: classification.ownedExactRoutes.map(summarizeRoute),
      foreignExactRoutes: classification.foreignExactRoutes.map(summarizeRoute),
      broadRoutes: classification.broadRoutes.map(summarizeRoute),
    },
    runtime: summarizeRuntime(runtime),
    backend,
    decision,
    nextAuthority: 'provider mutation remains separately founder-gated',
  };

  await mkdir('artifacts', { recursive: true });
  await writeFile(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(`APP_DOMAIN_OWNERSHIP_INSPECTION_RETAINED decision=${decision} path=${EVIDENCE_PATH}`);
  return evidence;
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  auditCloudflareAppDomainOwnership().catch(() => {
    console.error('CLOUDFLARE_APP_DOMAIN_OWNERSHIP_INSPECTION_FAILED');
    process.exitCode = 1;
  });
}
