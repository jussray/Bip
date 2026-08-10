import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REQUIRED_CLOUDFLARE_CHECKS = Object.freeze(['Workers Builds: sekret-backend']);
const TERMINAL_FAILURES = new Set(['action_required', 'cancelled', 'failure', 'stale', 'timed_out']);

function normalizeSha(value) {
  const sha = String(value ?? '').trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

function newestFirst(a, b) {
  return Date.parse(b.completed_at ?? b.started_at ?? '1970-01-01T00:00:00Z')
    - Date.parse(a.completed_at ?? a.started_at ?? '1970-01-01T00:00:00Z');
}

function selectNewestCheck(checkRuns, name) {
  return checkRuns.filter((run) => run?.name === name).sort(newestFirst)[0] ?? null;
}

export function evaluateChecks(checkRuns, requiredChecks = REQUIRED_CLOUDFLARE_CHECKS) {
  const selected = Object.fromEntries(requiredChecks.map((name) => [name, selectNewestCheck(checkRuns, name)]));
  const missing = requiredChecks.filter((name) => !selected[name]);
  const pending = requiredChecks.filter((name) => selected[name] && selected[name].status !== 'completed');
  const failed = requiredChecks.filter((name) => {
    const run = selected[name];
    return run?.status === 'completed' && TERMINAL_FAILURES.has(run.conclusion);
  });
  const unsuccessful = requiredChecks.filter((name) => {
    const run = selected[name];
    return run?.status === 'completed' && run.conclusion !== 'success';
  });
  return {
    complete: missing.length === 0 && pending.length === 0 && unsuccessful.length === 0,
    missing,
    pending,
    failed,
    unsuccessful,
    selected,
  };
}

export function evaluatePagesMarker(marker, expectedSha) {
  const expected = normalizeSha(expectedSha);
  const actual = normalizeSha(marker?.commitSha);
  return {
    complete: Boolean(expected && actual === expected),
    expectedSha: expected,
    actualSha: actual,
    marker: marker && typeof marker === 'object' ? marker : null,
  };
}

export function evaluateWorkerWitness(health, expectedSha) {
  const expected = normalizeSha(expectedSha);
  const releaseSha = normalizeSha(health?.releaseSha);
  const version = health?.version && typeof health.version === 'object' ? health.version : null;
  return {
    complete: Boolean(expected && health?.ok === true && releaseSha === expected),
    healthAvailable: Boolean(health && typeof health === 'object'),
    healthOk: health?.ok === true,
    expectedSha: expected,
    releaseSha,
    versionId: typeof version?.id === 'string' && version.id.trim() ? version.id.trim() : null,
    versionTag: typeof version?.tag === 'string' && version.tag.trim() ? version.tag.trim().toLowerCase() : null,
    versionTimestamp: typeof version?.timestamp === 'string' ? version.timestamp : null,
  };
}

export function classifyReadiness(checks, pages, worker) {
  if (checks.failed.length > 0) return 'worker-build-failed';
  if (checks.unsuccessful.length > 0) return 'worker-build-unsuccessful';
  if (checks.missing.length > 0) return 'worker-build-missing';
  if (checks.pending.length > 0) return 'worker-build-pending';
  if (!pages.actualSha) return 'pages-marker-missing';
  if (!pages.complete) return 'pages-marker-stale';
  if (!worker.healthAvailable) return 'worker-health-missing';
  if (!worker.healthOk) return 'worker-health-unhealthy';
  if (!worker.releaseSha) return 'worker-release-sha-missing';
  if (!worker.complete) return 'worker-release-sha-stale';
  return 'ready';
}

function publicCheck(run) {
  if (!run) return null;
  return {
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    detailsUrl: run.details_url,
    checkRunUrl: run.html_url,
    externalId: run.external_id,
  };
}

export function buildEvidence({repository, sha, releaseUrl, backendHealthUrl, checks, pages, worker, startedAtMs, observedAtMs, status}) {
  const readinessState = classifyReadiness(checks, pages, worker);
  const complete = checks.complete && pages.complete && worker.complete;
  return {
    version: 5,
    repository,
    commitSha: normalizeSha(sha),
    expectedSha: normalizeSha(sha),
    status,
    complete,
    readinessState,
    startedAt: new Date(startedAtMs).toISOString(),
    observedAt: new Date(observedAtMs).toISOString(),
    elapsedMs: Math.max(0, observedAtMs - startedAtMs),
    verifiedAt: complete ? new Date(observedAtMs).toISOString() : null,
    deploymentMode: 'cloudflare-native-git-integration',
    identityAuthority: 'workers-build-sha-baked-into-runtime',
    checkSummary: {
      missing: [...checks.missing],
      pending: [...checks.pending],
      failed: [...checks.failed],
      unsuccessful: [...checks.unsuccessful],
    },
    requiredChecks: Object.fromEntries(REQUIRED_CLOUDFLARE_CHECKS.map((name) => [name, publicCheck(checks.selected[name])])),
    pagesRelease: {
      url: releaseUrl,
      commitSha: pages.actualSha,
      expectedSha: pages.expectedSha,
      complete: pages.complete,
      marker: pages.marker,
    },
    workerRuntime: {
      url: backendHealthUrl,
      expectedSha: worker.expectedSha,
      releaseSha: worker.releaseSha,
      versionId: worker.versionId,
      versionTag: worker.versionTag,
      versionTimestamp: worker.versionTimestamp,
      healthOk: worker.healthOk,
      complete: worker.complete,
    },
  };
}

function writeEvidence(evidencePath, evidence) {
  fs.mkdirSync(path.dirname(evidencePath), {recursive: true});
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

async function fetchCheckRuns(repository, sha, token) {
  const [owner, repo] = repository.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100&filter=all`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'sekret-bip-production-witness',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`GitHub check-runs lookup failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  const payload = await response.json();
  return Array.isArray(payload.check_runs) ? payload.check_runs : [];
}

async function fetchJsonNoCache(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.set('verify', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const response = await fetch(url, {headers: {Accept: 'application/json', 'Cache-Control': 'no-cache, no-store, max-age=0'}});
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function verifyProductionReleaseWitness(env = process.env) {
  const repository = env.GITHUB_REPOSITORY;
  const sha = normalizeSha(env.EXPECTED_RELEASE_SHA || env.GITHUB_SHA);
  const token = env.GITHUB_TOKEN;
  const releaseUrl = env.FRONTEND_RELEASE_URL ?? 'https://sekretbip.net/.well-known/sekret-release.json';
  const backendHealthUrl = env.BACKEND_HEALTH_URL ?? 'https://api.sekretbip.net/health';
  const timeoutMs = Number(env.CLOUDFLARE_CHECK_TIMEOUT_MS ?? 25 * 60 * 1000);
  const pollMs = Number(env.CLOUDFLARE_CHECK_POLL_MS ?? 10_000);
  const evidencePath = env.CLOUDFLARE_EVIDENCE_PATH ?? 'artifacts/cloudflare-native-deploy.json';

  if (!repository || !sha || !token) throw new Error('GITHUB_REPOSITORY, exact release SHA, and GITHUB_TOKEN are required.');

  const startedAtMs = Date.now();
  const deadline = startedAtMs + timeoutMs;
  let checks = evaluateChecks([]);
  let pages = evaluatePagesMarker(null, sha);
  let worker = evaluateWorkerWitness(null, sha);

  while (Date.now() < deadline) {
    const observedAtMs = Date.now();
    const [checkRuns, marker, health] = await Promise.all([
      fetchCheckRuns(repository, sha, token),
      fetchJsonNoCache(releaseUrl).catch(() => null),
      fetchJsonNoCache(backendHealthUrl).catch(() => null),
    ]);
    checks = evaluateChecks(checkRuns);
    pages = evaluatePagesMarker(marker, sha);
    worker = evaluateWorkerWitness(health, sha);
    const complete = checks.complete && pages.complete && worker.complete;
    const evidence = buildEvidence({repository, sha, releaseUrl, backendHealthUrl, checks, pages, worker, startedAtMs, observedAtMs, status: complete ? 'succeeded' : 'observing'});
    writeEvidence(evidencePath, evidence);

    if (checks.failed.length > 0) throw new Error(`Cloudflare Worker build failed: ${checks.failed.join(', ')}`);
    if (complete) {
      console.log(JSON.stringify(evidence, null, 2));
      return evidence;
    }

    console.log(`Waiting for exact production release [${evidence.readinessState}] after ${evidence.elapsedMs}ms: Pages ${pages.actualSha ?? 'missing'} -> ${sha}; Worker runtime ${worker.releaseSha ?? 'missing'} -> ${sha}`);
    await sleep(pollMs);
  }

  const evidence = buildEvidence({repository, sha, releaseUrl, backendHealthUrl, checks, pages, worker, startedAtMs, observedAtMs: Date.now(), status: 'timed-out'});
  writeEvidence(evidencePath, evidence);
  throw new Error(`Timed out waiting for exact production release [${evidence.readinessState}]. Pages: ${pages.actualSha ?? 'missing'}; Worker runtime: ${worker.releaseSha ?? 'missing'}; expected: ${sha}; evidence: ${evidencePath}`);
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  verifyProductionReleaseWitness().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
