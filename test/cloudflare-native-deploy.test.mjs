import assert from 'node:assert/strict';
import test from 'node:test';
import {
  REQUIRED_CLOUDFLARE_CHECKS,
  evaluateCloudflareChecks,
  evaluateReleaseMarker,
} from '../scripts/verify-cloudflare-native-deploy.mjs';

const workerSuccess = {
  name: 'Workers Builds: sekret-backend',
  status: 'completed',
  conclusion: 'success',
  started_at: '2026-07-12T23:00:00Z',
  completed_at: '2026-07-12T23:01:00Z',
};

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
