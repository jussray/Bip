import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RELEASE_OBSERVATION_MARKER,
  buildReleaseObservationComment,
  upsertReleaseObservation,
  validateReleaseEvidence,
} from '../scripts/publish-production-release-observation.mjs';

const SHA = '22a5f0ba9d55eeb97d6aaa88e876f77a97e5a440';

function releaseEvidence(overrides = {}) {
  return {
    version: 3,
    repository: 'jussray/Sekret-Bip',
    commitSha: SHA,
    expectedSha: SHA,
    status: 'succeeded',
    complete: true,
    verifiedAt: '2026-08-04T20:00:00.000Z',
    requiredChecks: {
      'Workers Builds: sekret-backend': {
        name: 'Workers Builds: sekret-backend',
        status: 'completed',
        conclusion: 'success',
      },
    },
    pagesRelease: {
      url: 'https://sekretbip.net/.well-known/sekret-release.json',
      commitSha: SHA,
      expectedSha: SHA,
      complete: true,
      marker: {
        environment: 'production',
        branch: 'main',
        deploymentProvider: 'cloudflare-pages',
        deploymentId: 'deployment-123',
      },
    },
    ...overrides,
  };
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

test('accepts only complete exact-SHA production evidence', () => {
  const result = validateReleaseEvidence(releaseEvidence(), SHA.toUpperCase());
  assert.equal(result.expectedSha, SHA);
  assert.equal(result.pagesRelease.complete, true);
});

test('rejects stale Pages release evidence', () => {
  assert.throws(
    () => validateReleaseEvidence(
      releaseEvidence({
        pagesRelease: {
          ...releaseEvidence().pagesRelease,
          commitSha: '1dba83386eb0a0865d051f2c74ae9046dafb5eeb',
        },
      }),
      SHA,
    ),
    /Pages release marker is not exact/,
  );
});

test('rejects incomplete Worker evidence', () => {
  assert.throws(
    () => validateReleaseEvidence(
      releaseEvidence({
        requiredChecks: {
          'Workers Builds: sekret-backend': {
            status: 'completed',
            conclusion: 'failure',
          },
        },
      }),
      SHA,
    ),
    /Required Cloudflare checks are not successful/,
  );
});

test('builds an immutable exact-release receipt', () => {
  const comment = buildReleaseObservationComment({
    evidence: releaseEvidence(),
    expectedSha: SHA,
    repository: 'jussray/Sekret-Bip',
    runId: '30779990000',
  });

  assert.match(comment, new RegExp(RELEASE_OBSERVATION_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(comment, new RegExp(SHA));
  assert.match(comment, /Pages branch: `main`/);
  assert.match(comment, /Backend health: `passed`/);
  assert.match(comment, /Production Playwright: `passed`/);
  assert.match(comment, /actions\/runs\/30779990000/);
});

test('updates the existing marked release receipt instead of duplicating it', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({url, options});
    if (String(url).includes('?per_page=100')) {
      return jsonResponse([{id: 42, body: `${RELEASE_OBSERVATION_MARKER}\nold`}]);
    }
    return jsonResponse({id: 42});
  };

  const result = await upsertReleaseObservation({
    fetchImpl,
    token: 'test-token',
    repository: 'jussray/Sekret-Bip',
    issueNumber: 696,
    comment: `${RELEASE_OBSERVATION_MARKER}\nnew`,
  });

  assert.deepEqual(result, {action: 'updated', commentId: 42});
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.method, 'PATCH');
  assert.match(calls[1].url, /issues\/comments\/42$/);
});

test('creates the first marked release receipt when none exists', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({url, options});
    if (String(url).includes('?per_page=100')) return jsonResponse([]);
    return jsonResponse({id: 84}, 201);
  };

  const result = await upsertReleaseObservation({
    fetchImpl,
    token: 'test-token',
    repository: 'jussray/Sekret-Bip',
    issueNumber: 696,
    comment: `${RELEASE_OBSERVATION_MARKER}\nfirst`,
  });

  assert.deepEqual(result, {action: 'created', commentId: 84});
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.method, 'POST');
  assert.match(calls[1].url, /issues\/696\/comments$/);
});
