import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWranglerDeployArgs,
  inspectDeployGitState,
  normalizeCommitSha,
  resolveDeployCommitSha,
} from '../scripts/deploy-cloudflare-worker.mjs';

const SHA = 'abcdef0123456789abcdef0123456789abcdef01';
const OTHER_SHA = '1234567890abcdef1234567890abcdef12345678';

function fakeGit({ head = SHA, status = '' } = {}) {
  return (_command, args) => {
    if (args[0] === 'rev-parse' && args[1] === 'HEAD') return `${head}\n`;
    if (args[0] === 'status') return status;
    throw new Error(`Unexpected git invocation: ${args.join(' ')}`);
  };
}

test('normalizes only exact 40-character Git SHAs', () => {
  assert.equal(normalizeCommitSha(SHA.toUpperCase()), SHA);
  assert.equal(normalizeCommitSha('abcdef'), null);
  assert.equal(normalizeCommitSha('not-a-sha'), null);
});

test('accepts only a clean checked-out Git HEAD for deployment', () => {
  assert.deepEqual(
    inspectDeployGitState({ execFile: fakeGit() }),
    { headSha: SHA, clean: true },
  );
});

test('refuses tracked or untracked dirty worktrees before deployment', () => {
  assert.throws(
    () => inspectDeployGitState({ execFile: fakeGit({ status: ' M worker/voice-entry.ts\n?? scratch.txt\n' }) }),
    /dirty worktree/,
  );
});

test('prefers the immutable Workers Builds commit SHA only when it matches checked-out HEAD', () => {
  assert.equal(
    resolveDeployCommitSha({
      env: { WORKERS_CI_COMMIT_SHA: SHA },
      execFile: fakeGit(),
    }),
    SHA,
  );
});

test('refuses a Workers Builds SHA that does not match checked-out HEAD', () => {
  assert.throws(
    () => resolveDeployCommitSha({
      env: { WORKERS_CI_COMMIT_SHA: OTHER_SHA },
      execFile: fakeGit(),
    }),
    /does not match checked-out Git HEAD/,
  );
});

test('refuses malformed Workers Builds identity instead of silently falling back', () => {
  assert.throws(
    () => resolveDeployCommitSha({
      env: { WORKERS_CI_COMMIT_SHA: 'deadbeef' },
      execFile: fakeGit(),
    }),
    /WORKERS_CI_COMMIT_SHA must be an exact 40-character Git commit SHA/,
  );
});

test('uses clean local HEAD when Workers Builds identity is absent', () => {
  assert.equal(
    resolveDeployCommitSha({ env: {}, execFile: fakeGit() }),
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
