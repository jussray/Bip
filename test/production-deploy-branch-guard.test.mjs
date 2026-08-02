import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertProductionDeployBranch,
  normalizeBranch,
  resolveDeployBranch,
} from '../scripts/assert-production-deploy-branch.mjs';

const noGitBranch = () => '';

test('normalizes common branch reference formats', () => {
  assert.equal(normalizeBranch('refs/heads/main'), 'main');
  assert.equal(normalizeBranch('refs/remotes/origin/feature/test'), 'feature/test');
  assert.equal(normalizeBranch('origin/main'), 'main');
});

test('allows Workers Builds production branch main', () => {
  const result = assertProductionDeployBranch({
    env: { WORKERS_CI: '1', WORKERS_CI_BRANCH: 'main' },
    readGitBranch: noGitBranch,
  });

  assert.deepEqual(result, { branch: 'main', source: 'WORKERS_CI_BRANCH' });
});

test('blocks Workers Builds feature branches before Wrangler executes', () => {
  assert.throws(
    () =>
      assertProductionDeployBranch({
        env: { WORKERS_CI: '1', WORKERS_CI_BRANCH: 'fix/cloudflare-guard' },
        readGitBranch: noGitBranch,
      }),
    /only main may run production deploy commands/,
  );
});

test('allows Cloudflare Pages production branch main', () => {
  const result = assertProductionDeployBranch({
    env: { CI: 'true', CF_PAGES_BRANCH: 'main' },
    readGitBranch: noGitBranch,
  });

  assert.equal(result.branch, 'main');
  assert.equal(result.source, 'CF_PAGES_BRANCH');
});

test('rejects conflicting provider and GitHub branch evidence', () => {
  assert.throws(
    () =>
      resolveDeployBranch({
        env: {
          WORKERS_CI_BRANCH: 'main',
          GITHUB_HEAD_REF: 'feature/conflict',
        },
        readGitBranch: noGitBranch,
      }),
    /Conflicting deployment branch evidence/,
  );
});

test('uses the local git branch when provider evidence is absent', () => {
  const result = assertProductionDeployBranch({
    env: {},
    readGitBranch: () => 'main',
  });

  assert.deepEqual(result, { branch: 'main', source: 'git' });
});

test('fails closed when CI branch authority is unavailable', () => {
  assert.throws(
    () =>
      assertProductionDeployBranch({
        env: { CI: 'true' },
        readGitBranch: noGitBranch,
      }),
    /branch authority is unknown/,
  );
});

test('permits an explicit detached-head override only outside CI', () => {
  const approved = assertProductionDeployBranch({
    env: {
      SEKRET_DEPLOY_BRANCH: 'main',
      SEKRET_PRODUCTION_DEPLOY_APPROVED: '1',
    },
    readGitBranch: noGitBranch,
  });
  assert.equal(approved.source, 'explicit-local-approval');

  assert.throws(
    () =>
      assertProductionDeployBranch({
        env: {
          CI: 'true',
          SEKRET_DEPLOY_BRANCH: 'main',
          SEKRET_PRODUCTION_DEPLOY_APPROVED: '1',
        },
        readGitBranch: noGitBranch,
      }),
    /branch authority is unknown/,
  );
});

test('production package scripts invoke the branch guard before deployment', async () => {
  const packageJson = (await import('../package.json', { with: { type: 'json' } })).default;
  assert.match(
    packageJson.scripts['deploy:api:production'],
    /^node scripts\/assert-production-deploy-branch\.mjs && wrangler deploy$/,
  );
  assert.match(
    packageJson.scripts['deploy:web:production'],
    /^node scripts\/assert-production-deploy-branch\.mjs && /,
  );
});
