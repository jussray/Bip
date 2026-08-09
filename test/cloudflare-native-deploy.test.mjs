import assert from 'node:assert/strict';
import test from 'node:test';
import {
  REQUIRED_CLOUDFLARE_CHECKS,
  buildCloudflareEvidence,
  classifyCloudflareReadiness,
  evaluateCloudflareChecks,
  evaluateReleaseMarker,
  evaluateWorkerRuntime,
} from '../scripts/verify-cloudflare-native-deploy.mjs';

const workerSuccess = {
  name: 'Workers Builds: sekret-backend',
  status: 'completed',
  conclusion: 'success',
  started_at: '2026-07-12T23:00:00Z',
  completed_at: '2026-07-12T23:01:00Z',
};

const expectedSha = 'abcdef0123456789abcdef0123456789abcdef01';
const matchingRelease = evaluateReleaseMarker({commitSha: expectedSha}, expectedSha);
const matchingWorker = evaluateWorkerRuntime({
  ok: true,
  worker: 'sekret-backend',
  version: {
    id: 'version-123',
    tag: expectedSha,
    timestamp: '2026-07-14T22:00:30Z',
  },
}, expectedSha);

function classify(checkRuns, marker = {commitSha: expectedSha}, health = matchingWorker.health) {
  return classifyCloudflareReadiness(
    evaluateCloudflareChecks(checkRuns),
    evaluateReleaseMarker(marker, expectedSha),
    evaluateWorkerRuntime(health, expectedSha),
  );
}

test('requires the exact native Worker deployment check', () => {
  assert.deepEqual(REQUIRED_CLOUDFLARE_CHECKS, [
    'Workers Builds: sekret-backend',
  ]);
});

test('passes the Worker gate only when the latest check succeeded', () => {
  const result = evaluateCloudflareChecks([workerSuccess]);
  assert.equal(result.complete, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.pending, []);
  assert.deepEqual(result.unsuccessful, []);
});

test('reports a missing or pending Worker deployment', () => {
  assert.deepEqual(
    evaluateCloudflareChecks([]).missing,
    ['Workers Builds: sekret-backend'],
  );

  const pending = evaluateCloudflareChecks([
    {...workerSuccess, status: 'in_progress', conclusion: null},
  ]);
  assert.equal(pending.complete, false);
  assert.deepEqual(pending.pending, ['Workers Builds: sekret-backend']);
});

test('fails closed on a completed unsuccessful Worker check', () => {
  const result = evaluateCloudflareChecks([
    {...workerSuccess, conclusion: 'failure'},
  ]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.failed, ['Workers Builds: sekret-backend']);
  assert.deepEqual(result.unsuccessful, ['Workers Builds: sekret-backend']);
});

test('uses the newest Worker check when GitHub contains retries', () => {
  const result = evaluateCloudflareChecks([
    {...workerSuccess, conclusion: 'failure', completed_at: '2026-07-12T22:59:00Z'},
    workerSuccess,
  ]);
  assert.equal(result.complete, true);
  assert.equal(result.selected['Workers Builds: sekret-backend'].conclusion, 'success');
});

test('requires the deployed Pages marker to match the exact commit', () => {
  const sha = 'ABCDEF0123456789ABCDEF0123456789ABCDEF01';
  const matching = evaluateReleaseMarker({commitSha: sha.toLowerCase()}, sha);
  assert.equal(matching.complete, true);
  assert.equal(matching.actualSha, sha.toLowerCase());

  const stale = evaluateReleaseMarker({commitSha: '1111111111111111111111111111111111111111'}, sha);
  assert.equal(stale.complete, false);
  assert.equal(stale.expectedSha, sha.toLowerCase());

  const missing = evaluateReleaseMarker(null, sha);
  assert.equal(missing.complete, false);
  assert.equal(missing.actualSha, null);
});

test('requires the live Worker version tag to match the exact commit', () => {
  assert.equal(matchingWorker.complete, true);
  assert.equal(matchingWorker.versionTag, expectedSha);
  assert.equal(matchingWorker.versionId, 'version-123');

  const stale = evaluateWorkerRuntime({
    ok: true,
    version: {
      id: 'version-old',
      tag: '1111111111111111111111111111111111111111',
      timestamp: '2026-07-14T21:00:00Z',
    },
  }, expectedSha);
  assert.equal(stale.complete, false);
  assert.equal(stale.versionTag, '1111111111111111111111111111111111111111');

  const untagged = evaluateWorkerRuntime({
    ok: true,
    version: { id: 'version-untagged', tag: null, timestamp: '2026-07-14T22:00:00Z' },
  }, expectedSha);
  assert.equal(untagged.complete, false);
  assert.equal(untagged.versionTag, null);
});

test('classifies every exact-release blocker without weakening the gate', () => {
  assert.equal(classify([workerSuccess]), 'ready');
  assert.equal(classify([]), 'worker-missing');
  assert.equal(
    classify([{...workerSuccess, status: 'in_progress', conclusion: null}]),
    'worker-pending',
  );
  assert.equal(
    classify([{...workerSuccess, conclusion: 'failure'}]),
    'worker-failed',
  );
  assert.equal(classify([workerSuccess], null), 'pages-marker-missing');
  assert.equal(
    classify([workerSuccess], {commitSha: '1111111111111111111111111111111111111111'}),
    'pages-marker-stale',
  );
  assert.equal(classify([workerSuccess], {commitSha: expectedSha}, null), 'worker-health-missing');
  assert.equal(
    classify([workerSuccess], {commitSha: expectedSha}, {ok: false}),
    'worker-health-unhealthy',
  );
  assert.equal(
    classify([workerSuccess], {commitSha: expectedSha}, {ok: true, version: null}),
    'worker-version-missing',
  );
  assert.equal(
    classify([workerSuccess], {commitSha: expectedSha}, {ok: true, version: {id: 'version-1', tag: null}}),
    'worker-version-tag-missing',
  );
  assert.equal(
    classify([workerSuccess], {commitSha: expectedSha}, {
      ok: true,
      version: {id: 'version-1', tag: '1111111111111111111111111111111111111111'},
    }),
    'worker-version-stale',
  );
});

test('failure evidence retains blocker state and exact SHA details', () => {
  const checkEvaluation = evaluateCloudflareChecks([]);
  const releaseEvaluation = evaluateReleaseMarker(
    {commitSha: '1111111111111111111111111111111111111111'},
    expectedSha,
  );
  const workerEvaluation = evaluateWorkerRuntime(null, expectedSha);
  const evidence = buildCloudflareEvidence({
    repository: 'jussray/Sekret-Bip',
    sha: expectedSha,
    releaseUrl: 'https://sekretbip.net/release.json',
    backendHealthUrl: 'https://api.sekretbip.net/health',
    checkEvaluation,
    releaseEvaluation,
    workerEvaluation,
    startedAtMs: Date.parse('2026-07-14T22:00:00Z'),
    observedAtMs: Date.parse('2026-07-14T22:05:00Z'),
    status: 'observing',
  });

  assert.equal(evidence.version, 4);
  assert.equal(evidence.complete, false);
  assert.equal(evidence.readinessState, 'worker-missing');
  assert.equal(evidence.elapsedMs, 300_000);
  assert.equal(evidence.expectedSha, expectedSha);
  assert.equal(evidence.pagesRelease.commitSha, '1111111111111111111111111111111111111111');
  assert.equal(evidence.workerRuntime.versionTag, null);
  assert.deepEqual(evidence.checkSummary.missing, ['Workers Builds: sekret-backend']);
  assert.equal(evidence.requiredChecks['Workers Builds: sekret-backend'], null);
  assert.equal(evidence.verifiedAt, null);
});

test('successful evidence joins GitHub, Pages, and Worker runtime identity', () => {
  const checkEvaluation = evaluateCloudflareChecks([workerSuccess]);
  const evidence = buildCloudflareEvidence({
    repository: 'jussray/Sekret-Bip',
    sha: expectedSha,
    releaseUrl: 'https://sekretbip.net/release.json',
    backendHealthUrl: 'https://api.sekretbip.net/health',
    checkEvaluation,
    releaseEvaluation: matchingRelease,
    workerEvaluation: matchingWorker,
    allCheckRuns: [workerSuccess],
    startedAtMs: Date.parse('2026-07-14T22:00:00Z'),
    observedAtMs: Date.parse('2026-07-14T22:01:00Z'),
    status: 'succeeded',
  });

  assert.equal(evidence.complete, true);
  assert.equal(evidence.readinessState, 'ready');
  assert.equal(evidence.repository, 'jussray/Sekret-Bip');
  assert.equal(evidence.commitSha, expectedSha);
  assert.equal(evidence.deploymentMode, 'cloudflare-native-git-integration');
  assert.equal(evidence.apiTokenRequiredInGitHub, false);
  assert.equal(evidence.requiredChecks['Workers Builds: sekret-backend'].conclusion, 'success');
  assert.equal(evidence.pagesRelease.commitSha, expectedSha);
  assert.equal(evidence.workerRuntime.versionTag, expectedSha);
  assert.equal(evidence.workerRuntime.versionId, 'version-123');
  assert.equal(evidence.workerRuntime.complete, true);
  assert.equal(evidence.verifiedAt, '2026-07-14T22:01:00.000Z');
});
