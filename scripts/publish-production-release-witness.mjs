import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  RELEASE_BLOCKER_MARKER,
  RELEASE_OBSERVATION_MARKER,
  upsertReleaseObservation,
} from './publish-production-release-observation.mjs';

function normalizeSha(value) {
  const sha = String(value ?? '').trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function validateProductionWitness(evidence, expectedSha) {
  const expected = normalizeSha(expectedSha);
  if (!expected) throw new Error('Expected release SHA is required.');
  const payload = objectOrEmpty(evidence);
  const pages = objectOrEmpty(payload.pagesRelease);
  const worker = objectOrEmpty(payload.workerRuntime);
  const evidenceSha = normalizeSha(payload.commitSha || payload.expectedSha);
  const pagesSha = normalizeSha(pages.commitSha || pages.expectedSha);
  const workerSha = normalizeSha(worker.releaseSha);

  if (payload.version !== 5) throw new Error(`Release evidence version 5 is required; observed ${payload.version ?? 'missing'}.`);
  if (evidenceSha !== expected) throw new Error(`Release evidence SHA mismatch: expected ${expected}, observed ${evidenceSha ?? 'missing'}.`);
  if (payload.complete !== true || payload.status !== 'succeeded') throw new Error('Release evidence is not complete and succeeded.');
  if (pages.complete !== true || pagesSha !== expected) throw new Error(`Pages release marker is not exact: expected ${expected}, observed ${pagesSha ?? 'missing'}.`);
  if (worker.complete !== true || worker.healthOk !== true || workerSha !== expected) {
    throw new Error(`Worker runtime SHA is not exact: expected ${expected}, observed ${workerSha ?? 'missing'}.`);
  }

  const requiredChecks = objectOrEmpty(payload.requiredChecks);
  const failedChecks = Object.entries(requiredChecks)
    .filter(([, check]) => check?.status !== 'completed' || check?.conclusion !== 'success')
    .map(([name]) => name);
  if (failedChecks.length > 0) throw new Error(`Required Cloudflare checks are not successful: ${failedChecks.join(', ')}.`);

  return {payload, expected, pages, worker, requiredChecks};
}

function safe(value, fallback = 'not reported') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function buildVerifiedWitnessComment({evidence, expectedSha, repository, runId, serverUrl = 'https://github.com'}) {
  const {payload, expected, pages, worker, requiredChecks} = validateProductionWitness(evidence, expectedSha);
  const checks = Object.entries(requiredChecks)
    .map(([name, check]) => `- ${name}: \`${safe(check?.conclusion)}\``)
    .join('\n');
  return `${RELEASE_OBSERVATION_MARKER}
## VERIFIED: exact production release observed

- Exact main SHA: \`${expected}\`
- Identity authority: \`${safe(payload.identityAuthority)}\`
- Pages marker SHA: \`${safe(pages.commitSha)}\`
- Worker runtime SHA: \`${safe(worker.releaseSha)}\`
- Worker version ID: \`${safe(worker.versionId, 'optional / unavailable')}\`
- Worker version tag: \`${safe(worker.versionTag, 'optional / unavailable')}\`
- Backend health: \`passed\`
- Supabase runtime contracts: \`passed\`
- Production Playwright: \`passed\`
- Verified at: \`${safe(payload.verifiedAt)}\`
- Workflow run: ${serverUrl}/${repository}/actions/runs/${runId}

### Required Cloudflare checks
${checks}

This receipt is valid only because the Pages release marker and the SHA baked into the live Worker runtime both match the exact release SHA, with required provider checks, backend health, Supabase runtime health, and production Playwright all passing in the same gate.
`;
}

export function buildBlockedWitnessComment({evidence, expectedSha, repository, runId, stepOutcomes = {}, serverUrl = 'https://github.com'}) {
  const expected = normalizeSha(expectedSha);
  if (!expected) throw new Error('Expected release SHA is required.');
  const payload = objectOrEmpty(evidence);
  const pages = objectOrEmpty(payload.pagesRelease);
  const worker = objectOrEmpty(payload.workerRuntime);
  const summary = objectOrEmpty(payload.checkSummary);
  const stepLines = Object.entries(objectOrEmpty(stepOutcomes))
    .map(([name, outcome]) => `- ${name}: \`${safe(outcome)}\``)
    .join('\n') || '- no step outcomes reported';
  return `${RELEASE_BLOCKER_MARKER}
## BLOCKED: exact production release not verified

- Intended main SHA: \`${expected}\`
- Evidence version: \`${safe(payload.version, 'missing')}\`
- Evidence status: \`${safe(payload.status, 'missing')}\`
- Readiness state: \`${safe(payload.readinessState, 'unknown')}\`
- Pages marker SHA: \`${safe(pages.commitSha, 'missing')}\`
- Worker runtime SHA: \`${safe(worker.releaseSha, 'missing')}\`
- Worker version ID: \`${safe(worker.versionId, 'optional / unavailable')}\`
- Worker version tag: \`${safe(worker.versionTag, 'optional / unavailable')}\`
- Workflow run: ${serverUrl}/${repository}/actions/runs/${runId}

### Verification step outcomes
${stepLines}

### Retained blockers
- Missing checks: \`${Array.isArray(summary.missing) && summary.missing.length ? summary.missing.join(', ') : 'none'}\`
- Pending checks: \`${Array.isArray(summary.pending) && summary.pending.length ? summary.pending.join(', ') : 'none'}\`
- Failed checks: \`${Array.isArray(summary.failed) && summary.failed.length ? summary.failed.join(', ') : 'none'}\`
- Unsuccessful checks: \`${Array.isArray(summary.unsuccessful) && summary.unsuccessful.length ? summary.unsuccessful.join(', ') : 'none'}\`

This blocked receipt is not production proof. The gate remains closed until the live Worker runtime SHA and Pages marker both match the exact intended release and every downstream health/Playwright witness passes.
`;
}

function readEvidence(evidencePath, expectedSha) {
  if (fs.existsSync(evidencePath)) return JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  return {
    version: 5,
    expectedSha: normalizeSha(expectedSha),
    status: 'evidence-missing',
    complete: false,
    readinessState: 'evidence-missing',
    checkSummary: {},
    pagesRelease: {},
    workerRuntime: {},
  };
}

function parseStepOutcomes(value) {
  if (!value) return {};
  try { return objectOrEmpty(JSON.parse(value)); } catch { return {parse_error: 'invalid RELEASE_STEP_OUTCOMES JSON'}; }
}

export async function publishProductionReleaseWitness(env = process.env) {
  const evidencePath = env.CLOUDFLARE_EVIDENCE_PATH || 'artifacts/cloudflare-native-deploy.json';
  const expectedSha = env.EXPECTED_RELEASE_SHA || env.GITHUB_SHA;
  const evidence = readEvidence(evidencePath, expectedSha);
  const issueNumber = Number(env.RELEASE_OBSERVATION_ISSUE || '696');
  const blocked = env.RELEASE_OBSERVATION_MODE === 'blocked';
  const comment = blocked
    ? buildBlockedWitnessComment({evidence, expectedSha, repository: env.GITHUB_REPOSITORY, runId: env.GITHUB_RUN_ID, stepOutcomes: parseStepOutcomes(env.RELEASE_STEP_OUTCOMES), serverUrl: env.GITHUB_SERVER_URL || 'https://github.com'})
    : buildVerifiedWitnessComment({evidence, expectedSha, repository: env.GITHUB_REPOSITORY, runId: env.GITHUB_RUN_ID, serverUrl: env.GITHUB_SERVER_URL || 'https://github.com'});

  return upsertReleaseObservation({
    apiUrl: env.GITHUB_API_URL || 'https://api.github.com',
    token: env.GITHUB_TOKEN,
    repository: env.GITHUB_REPOSITORY,
    issueNumber,
    comment,
    marker: blocked ? RELEASE_BLOCKER_MARKER : RELEASE_OBSERVATION_MARKER,
  });
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  publishProductionReleaseWitness().then((result) => console.log(JSON.stringify(result))).catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
