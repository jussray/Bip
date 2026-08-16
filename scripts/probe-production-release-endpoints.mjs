import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DEFAULT_FRONTEND_RELEASE_URL = 'https://app.sekretbip.net/.well-known/sekret-release.json';
const DEFAULT_BACKEND_HEALTH_URL = 'https://api.sekretbip.net/health';
const DEFAULT_EVIDENCE_PATH = 'artifacts/production-release-endpoint-probe.json';

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isCloudflareAccessUrl(rawUrl) {
  if (!rawUrl) return false;
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    return hostname === 'cloudflareaccess.com' || hostname.endsWith('.cloudflareaccess.com');
  } catch {
    return false;
  }
}

export function classifyEndpointProbe(evidence) {
  if (evidence?.redirected && isCloudflareAccessUrl(evidence?.finalUrl)) {
    return 'cloudflare-access-intercepted';
  }
  if (evidence?.jsonState === 'fetch-error') return 'fetch-error';
  if (evidence?.ok !== true) return 'http-error';
  if (evidence?.jsonState !== 'ok') return 'invalid-json';
  return 'ok';
}

export async function probeJsonEndpoint(rawUrl, {fetchImpl = fetch} = {}) {
  const requestedUrl = new URL(rawUrl);
  requestedUrl.searchParams.set('probe', `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  try {
    const response = await fetchImpl(requestedUrl, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, max-age=0',
      },
      redirect: 'follow',
    });

    const contentType = safeString(response.headers.get('content-type'));
    let json = null;
    let jsonState = response.ok ? 'invalid' : 'skipped-non-ok';

    if (response.ok) {
      try {
        json = await response.json();
        jsonState = 'ok';
      } catch {
        jsonState = 'invalid';
      }
    }

    const evidence = {
      requestedUrl: rawUrl,
      finalUrl: safeString(response.url),
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      contentType,
      jsonState,
      commitSha: safeString(json?.commitSha),
      releaseSha: safeString(json?.releaseSha),
      healthOk: json?.ok === true,
    };

    return {
      ...evidence,
      classification: classifyEndpointProbe(evidence),
    };
  } catch (error) {
    return {
      requestedUrl: rawUrl,
      finalUrl: null,
      status: null,
      ok: false,
      redirected: false,
      contentType: null,
      jsonState: 'fetch-error',
      commitSha: null,
      releaseSha: null,
      healthOk: false,
      classification: 'fetch-error',
      errorName: error instanceof Error ? error.name : 'UnknownError',
    };
  }
}

export async function collectProductionReleaseEndpointEvidence({
  frontendReleaseUrl = process.env.FRONTEND_RELEASE_URL ?? DEFAULT_FRONTEND_RELEASE_URL,
  backendHealthUrl = process.env.BACKEND_HEALTH_URL ?? DEFAULT_BACKEND_HEALTH_URL,
  expectedSha = process.env.EXPECTED_RELEASE_SHA ?? process.env.GITHUB_SHA ?? null,
  fetchImpl = fetch,
} = {}) {
  const [frontend, backend] = await Promise.all([
    probeJsonEndpoint(frontendReleaseUrl, {fetchImpl}),
    probeJsonEndpoint(backendHealthUrl, {fetchImpl}),
  ]);

  const blockedByAccess = [
    frontend.classification === 'cloudflare-access-intercepted' ? 'frontend' : null,
    backend.classification === 'cloudflare-access-intercepted' ? 'backend' : null,
  ].filter(Boolean);

  return {
    version: 2,
    observedAt: new Date().toISOString(),
    expectedSha: safeString(expectedSha)?.toLowerCase() ?? null,
    status: blockedByAccess.length > 0 ? 'cloudflare-access-intercepted' : 'observed',
    blockedByAccess,
    frontend,
    backend,
  };
}

export function writeProductionReleaseEndpointEvidence(evidence, evidencePath = DEFAULT_EVIDENCE_PATH) {
  fs.mkdirSync(path.dirname(evidencePath), {recursive: true});
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return evidencePath;
}

async function main() {
  const evidence = await collectProductionReleaseEndpointEvidence();
  const evidencePath = process.env.RELEASE_ENDPOINT_PROBE_PATH ?? DEFAULT_EVIDENCE_PATH;
  writeProductionReleaseEndpointEvidence(evidence, evidencePath);
  console.log(JSON.stringify(evidence, null, 2));

  if (evidence.status === 'cloudflare-access-intercepted') {
    throw new Error(`CLOUDFLARE_ACCESS_INTERCEPTED surfaces=${evidence.blockedByAccess.join(',')}`);
  }
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
}
