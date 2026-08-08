import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWranglerDeployArgs,
  normalizeCommitSha,
  resolveDeployCommitSha,
} from '../scripts/deploy-cloudflare-worker.mjs';

const SHA = 'abcdef0123456789abcdef0123456789abcdef01';

test('normalizes only exact 40-character Git SHAs', () => {
  assert.equal(normalizeCommitSha(SHA.toUpperCase()), SHA);
  assert.equal(normalizeCommitSha('abcdef'), null);
  assert.equal(normalizeCommitSha('not-a-sha'), null);
});

test('prefers the immutable Workers Builds commit SHA', () => {
  assert.equal(
    resolveDeployCommitSha({ env: { WORKERS_CI_COMMIT_SHA: SHA } }),
    SHA,
  );
});

test('builds a Wrangler deployment command tagged to the exact Git SHA', () => {
  assert.deepEqual(buildWranglerDeployArgs(SHA), [
    'wrangler',
    'deploy',
    '--tag',
    SHA,
    '--message',
    `git:${SHA}`,
  ]);
});

test('refuses malformed deployment identity', () => {
  assert.throws(
    () => buildWranglerDeployArgs('deadbeef'),
    /valid 40-character Git commit SHA/,
  );
});
