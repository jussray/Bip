import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REQUIRED_CLOUDFLARE_CHECKS = Object.freeze([
  'Workers Builds: sekret-backend',
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

export function evaluateCloudflareChecks(checkRuns, requiredChecks = REQUIRED_CLOUDFLARE_CHECKS) {
  const selected = {};

  for (const requiredName of requiredChecks) {
    const candidates = checkRuns
      .filter((run) => run?.name === requiredName)
      .sort(newestFirst);
    selected[requiredName] = candidates[0] ?? null;
  }

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

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchCheckRuns({repository, sha, token}) {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`,
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
  const timeoutMs = Number(process.env.CLOUDFLARE_CHECK_TIMEOUT_MS ?? 15 * 60 * 1000);
  const pollMs = Number(process.env.CLOUDFLARE_CHECK_POLL_MS ?? 10_000);
  const evidencePath = process.env.CLOUDFLARE_EVIDENCE_PATH ?? 'artifacts/cloudflare-native-deploy.json';

  if (!repository || !sha || !token) {
    throw new Error('GITHUB_REPOSITORY, GITHUB_SHA, and GITHUB_TOKEN are required.');
  }

  const deadline = Date.now() + timeoutMs;
  let evaluation;

  while (Date.now() < deadline) {
    const checkRuns = await fetchCheckRuns({repository, sha, token});
    evaluation = evaluateCloudflareChecks(checkRuns);

    if (evaluation.failed.length > 0) {
      throw new Error(`Cloudflare native deployment failed: ${evaluation.failed.join(', ')}`);
    }

    if (evaluation.complete) break;

    const waitingFor = [...evaluation.missing, ...evaluation.pending, ...evaluation.unsuccessful];
    console.log(`Waiting for Cloudflare native deployment checks: ${[...new Set(waitingFor)].join(', ')}`);
    await sleep(pollMs);
  }

  if (!evaluation?.complete) {
    throw new Error(
      `Timed out waiting for successful Cloudflare native deployment checks. Missing: ${evaluation?.missing.join(', ') || 'none'}; pending: ${evaluation?.pending.join(', ') || 'none'}; unsuccessful: ${evaluation?.unsuccessful.join(', ') || 'none'}`,
    );
  }

  const evidence = {
    version: 1,
    repository,
    commitSha: sha,
    verifiedAt: new Date().toISOString(),
    deploymentMode: 'cloudflare-native-git-integration',
    apiTokenRequiredInGitHub: false,
    checks: Object.fromEntries(
      REQUIRED_CLOUDFLARE_CHECKS.map((name) => [name, publicCheckEvidence(evaluation.selected[name])]),
    ),
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
