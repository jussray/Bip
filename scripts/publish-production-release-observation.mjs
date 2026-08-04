import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const RELEASE_OBSERVATION_MARKER = '<!-- sekret-production-release-observation -->';

function normalizeSha(value) {
  return String(value ?? '').trim().toLowerCase();
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

export function validateReleaseEvidence(evidence, expectedSha) {
  const normalizedExpected = normalizeSha(expectedSha);
  if (!normalizedExpected) {
    throw new Error('Expected release SHA is required.');
  }

  const payload = assertObject(evidence, 'Release evidence');
  const observedSha = normalizeSha(payload.commitSha || payload.expectedSha);
  if (observedSha !== normalizedExpected) {
    throw new Error(
      `Release evidence SHA mismatch: expected ${normalizedExpected}, observed ${observedSha || 'missing'}.`,
    );
  }

  if (payload.complete !== true || payload.status !== 'succeeded') {
    throw new Error('Release evidence is not complete and succeeded.');
  }

  const pagesRelease = assertObject(payload.pagesRelease, 'Pages release evidence');
  const pagesSha = normalizeSha(pagesRelease.commitSha || pagesRelease.expectedSha);
  if (pagesRelease.complete !== true || pagesSha !== normalizedExpected) {
    throw new Error(
      `Pages release marker is not exact: expected ${normalizedExpected}, observed ${pagesSha || 'missing'}.`,
    );
  }

  const requiredChecks = assertObject(payload.requiredChecks, 'Required Cloudflare checks');
  const failedChecks = Object.entries(requiredChecks)
    .filter(([, check]) => check?.status !== 'completed' || check?.conclusion !== 'success')
    .map(([name]) => name);
  if (failedChecks.length > 0) {
    throw new Error(`Required Cloudflare checks are not successful: ${failedChecks.join(', ')}.`);
  }

  return {
    evidence: payload,
    expectedSha: normalizedExpected,
    pagesRelease,
    requiredChecks,
  };
}

function safeValue(value, fallback = 'not reported') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function buildReleaseObservationComment({
  evidence,
  expectedSha,
  repository,
  runId,
  serverUrl = 'https://github.com',
}) {
  const validated = validateReleaseEvidence(evidence, expectedSha);
  const marker = validated.pagesRelease.marker && typeof validated.pagesRelease.marker === 'object'
    ? validated.pagesRelease.marker
    : {};
  const workerChecks = Object.entries(validated.requiredChecks)
    .map(([name, check]) => `- ${name}: \`${safeValue(check?.conclusion)}\``)
    .join('\n');
  const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`;

  return `${RELEASE_OBSERVATION_MARKER}
## VERIFIED: exact production release observed

- Exact main SHA: \`${validated.expectedSha}\`
- Release verifier: \`${safeValue(validated.evidence.status)}\`
- Verified at: \`${safeValue(validated.evidence.verifiedAt)}\`
- Pages marker SHA: \`${safeValue(validated.pagesRelease.commitSha)}\`
- Pages environment: \`${safeValue(marker.environment)}\`
- Pages branch: \`${safeValue(marker.branch)}\`
- Deployment provider: \`${safeValue(marker.deploymentProvider)}\`
- Deployment ID: \`${safeValue(marker.deploymentId)}\`
- Backend health: \`passed\`
- Supabase runtime contracts: \`passed\`
- Production Playwright: \`passed\`
- Workflow run: ${runUrl}

### Required Cloudflare checks
${workerChecks}

This receipt is generated only after the exact-SHA Cloudflare observer, release marker, backend health, runtime-contract health, and production Playwright steps all pass. It updates the existing marked receipt instead of creating duplicate release claims.
`;
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function githubRequest(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  const body = await readResponseBody(response);
  if (!response.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`GitHub API request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return body;
}

export async function upsertReleaseObservation({
  fetchImpl = fetch,
  apiUrl = 'https://api.github.com',
  token,
  repository,
  issueNumber,
  comment,
}) {
  if (!token) throw new Error('GITHUB_TOKEN is required.');
  if (!repository || !repository.includes('/')) throw new Error('GITHUB_REPOSITORY is required.');
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error('A positive release observation issue number is required.');
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'sekret-bip-production-release-observer',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const commentsUrl = `${apiUrl}/repos/${repository}/issues/${issueNumber}/comments?per_page=100`;
  const comments = await githubRequest(fetchImpl, commentsUrl, {headers});
  const existing = Array.isArray(comments)
    ? comments.find((entry) => typeof entry?.body === 'string' && entry.body.includes(RELEASE_OBSERVATION_MARKER))
    : null;

  if (existing?.id) {
    await githubRequest(fetchImpl, `${apiUrl}/repos/${repository}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({body: comment}),
    });
    return {action: 'updated', commentId: existing.id};
  }

  const created = await githubRequest(fetchImpl, `${apiUrl}/repos/${repository}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({body: comment}),
  });
  return {action: 'created', commentId: created?.id ?? null};
}

export async function publishProductionReleaseObservation(env = process.env) {
  const evidencePath = env.CLOUDFLARE_EVIDENCE_PATH || 'artifacts/cloudflare-native-deploy.json';
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const issueNumber = Number(env.RELEASE_OBSERVATION_ISSUE || '696');
  const comment = buildReleaseObservationComment({
    evidence,
    expectedSha: env.EXPECTED_RELEASE_SHA || env.GITHUB_SHA,
    repository: env.GITHUB_REPOSITORY,
    runId: env.GITHUB_RUN_ID,
    serverUrl: env.GITHUB_SERVER_URL || 'https://github.com',
  });

  const result = await upsertReleaseObservation({
    apiUrl: env.GITHUB_API_URL || 'https://api.github.com',
    token: env.GITHUB_TOKEN,
    repository: env.GITHUB_REPOSITORY,
    issueNumber,
    comment,
  });
  console.log(JSON.stringify(result));
  return result;
}

const isDirectExecution = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  publishProductionReleaseObservation().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
