import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REQUIRED_CLOUDFLARE_CHECKS = Object.freeze([
  'Workers Builds: sekret-backend',
]);

export const OPTIONAL_CLOUDFLARE_CHECKS = Object.freeze([
  'Cloudflare Pages',
]);

const TERMINAL_FAILURES = new Set([
  'action_required',
  'cancelled',
  'failure',
  'stale',
  'timed_out',
]);

function newestFirst(a, b) {
  const aTime = Date.parse(a.completed_at ?? a.started_at ?? '1970-01-01T00:00:00Z');
  const bTime = Date.parse(b.completed_at ?? b.started_at ?? '1970-01-01T00:00:00Z');
  return bTime - aTime;
}

function selectNewestCheck(checkRuns, name) {
  return checkRuns
    .filter((run) => run?.name === name)
    .sort(newestFirst)[0] ?? null;
}

export function evaluateCloudflareChecks(checkRuns, requiredChecks = REQUIRED_CLOUDFLARE_CHECKS) {
  const selected = Object.fromEntries(
    requiredChecks.map((name) => [name, selectNewestCheck(checkRuns, name)]),
  );

  const missing = requiredChecks.filter((name) => !selected[name]);
  const pending = requiredChecks.filter((name) => {
    const run = selected[name];
    return run && run.status !== 'completed';
  });
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

export function evaluateReleaseMarker(marker, expectedSha) {
  const actualSha = typeof marker?.commitSha === 'string' ? marker.commitSha.trim().toLowerCase() : '';
  const normalizedExpected = String(expectedSha ?? '').trim().toLowerCase();
  return {
    complete: Boolean(normalizedExpected) && actualSha === normalizedExpected,
    expectedSha: normalizedExpected,
    actualSha: actualSha || null,
    marker: marker && typeof marker === 'object' ? marker : null,
  };
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchCheckRuns({repository, sha, token}) {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100&filter=all`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'sekret-bip-cloudflare-native-verifier',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub check-runs lookup failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.check_runs) ? payload.check_runs : [];
}

async function fetchReleaseMarker(releaseUrl) {
  const url = new URL(releaseUrl);
  url.searchParams.set('verify', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, max-age=0',
    },
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

function publicCheckEvidence(run) {
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

async function verifyCloudflareNativeDeploy() {
  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  const token = process.env.GITHUB_TOKEN;
  const releaseUrl = process.env.FRONTEND_RELEASE_URL ?? 'https://sekretbip.net/release.json';
  const timeoutMs = Number(process.env.CLOUDFLARE_CHECK_TIMEOUT_MS ?? 25 * 60 * 1000);
  const pollMs = Number(process.env.CLOUDFLARE_CHECK_POLL_MS ?? 10_000);
  const evidencePath = process.env.CLOUDFLARE_EVIDENCE_PATH ?? 'artifacts/cloudflare-native-deploy.json';

  if (!repository || !sha || !token) {
    throw new Error('GITHUB_REPOSITORY, GITHUB_SHA, and GITHUB_TOKEN are required.');
  }

  const deadline = Date.now() + timeoutMs;
  let checkEvaluation;
  let releaseEvaluation = evaluateReleaseMarker(null, sha);
  let allCheckRuns = [];

  while (Date.now() < deadline) {
    allCheckRuns = await fetchCheckRuns({repository, sha, token});
    checkEvaluation = evaluateCloudflareChecks(allCheckRuns);

    if (checkEvaluation.failed.length > 0) {
      throw new Error(`Cloudflare Worker deployment failed: ${checkEvaluation.failed.join(', ')}`);
    }

    const marker = await fetchReleaseMarker(releaseUrl).catch(() => null);
    releaseEvaluation = evaluateReleaseMarker(marker, sha);

    if (checkEvaluation.complete && releaseEvaluation.complete) break;

    const waitingFor = [
      ...checkEvaluation.missing,
      ...checkEvaluation.pending,
      ...checkEvaluation.unsuccessful,
      ...(releaseEvaluation.complete ? [] : [`Pages release marker ${releaseEvaluation.actualSha ?? 'missing'} -> ${sha}`]),
    ];
    console.log(`Waiting for exact production release: ${[...new Set(waitingFor)].join(', ')}`);
    await sleep(pollMs);
  }

  if (!checkEvaluation?.complete || !releaseEvaluation.complete) {
    throw new Error(
      `Timed out waiting for the exact production release. Worker missing: ${checkEvaluation?.missing.join(', ') || 'none'}; Worker pending: ${checkEvaluation?.pending.join(', ') || 'none'}; Worker unsuccessful: ${checkEvaluation?.unsuccessful.join(', ') || 'none'}; Pages marker: ${releaseEvaluation.actualSha ?? 'missing'}; expected: ${sha}`,
    );
  }

  const optionalChecks = Object.fromEntries(
    OPTIONAL_CLOUDFLARE_CHECKS.map((name) => [name, publicCheckEvidence(selectNewestCheck(allCheckRuns, name))]),
  );

  const evidence = {
    version: 2,
    repository,
    commitSha: sha,
    verifiedAt: new Date().toISOString(),
    deploymentMode: 'cloudflare-native-git-integration',
    apiTokenRequiredInGitHub: false,
    requiredChecks: Object.fromEntries(
      REQUIRED_CLOUDFLARE_CHECKS.map((name) => [name, publicCheckEvidence(checkEvaluation.selected[name])]),
    ),
    optionalChecks,
    pagesRelease: {
      url: releaseUrl,
      commitSha: releaseEvaluation.actualSha,
      marker: releaseEvaluation.marker,
    },
  };

  fs.mkdirSync(path.dirname(evidencePath), {recursive: true});
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  verifyCloudflareNativeDeploy().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
}
