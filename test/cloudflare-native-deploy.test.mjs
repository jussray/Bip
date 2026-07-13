import assert from 'node:assert/strict';
import test from 'node:test';
import {
  REQUIRED_CLOUDFLARE_CHECKS,
  evaluateCloudflareChecks,
} from '../scripts/verify-cloudflare-native-deploy.mjs';

const workerSuccess = {
  name: 'Workers Builds: sekret-backend',
  status: 'completed',
  conclusion: 'success',
  started_at: '2026-07-12T23:00:00Z',
  completed_at: '2026-07-12T23:01:00Z',
};

const pagesSuccess = {
  name: 'Cloudflare Pages',
  status: 'completed',
  conclusion: 'success',
  started_at: '2026-07-12T23:00:00Z',
  completed_at: '2026-07-12T23:01:30Z',
};

test('requires the native Worker and Pages checks', () => {
  assert.deepEqual(REQUIRED_CLOUDFLARE_CHECKS, [
    'Workers Builds: sekret-backend',
    'Cloudflare Pages',
  ]);
});

test('passes only when both native Cloudflare checks succeeded', () => {
  const result = evaluateCloudflareChecks([workerSuccess, pagesSuccess]);
  assert.equal(result.complete, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.pending, []);
  assert.deepEqual(result.unsuccessful, []);
});

test('reports missing and pending deployments', () => {
  const result = evaluateCloudflareChecks([
    {...workerSuccess, status: 'in_progress', conclusion: null},
  ]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.missing, ['Cloudflare Pages']);
  assert.deepEqual(result.pending, ['Workers Builds: sekret-backend']);
});

test('fails closed on a completed unsuccessful check', () => {
  const result = evaluateCloudflareChecks([
    workerSuccess,
    {...pagesSuccess, conclusion: 'failure'},
  ]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.failed, ['Cloudflare Pages']);
  assert.deepEqual(result.unsuccessful, ['Cloudflare Pages']);
});

test('uses the newest check when GitHub contains retries', () => {
  const result = evaluateCloudflareChecks([
    {...workerSuccess, conclusion: 'failure', completed_at: '2026-07-12T22:59:00Z'},
    workerSuccess,
    pagesSuccess,
  ]);
  assert.equal(result.complete, true);
  assert.equal(result.selected['Workers Builds: sekret-backend'].conclusion, 'success');
});
