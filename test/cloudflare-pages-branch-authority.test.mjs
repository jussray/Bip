import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluatePagesBranchAuthority,
  fingerprintPagesAuthority,
  normalizePagesProject,
} from '../scripts/verify-cloudflare-pages-branch-authority.mjs';

function project(overrides = {}) {
  const sourceConfig = {
    owner: 'jussray',
    production_branch: 'main',
    production_deployments_enabled: true,
    preview_deployment_setting: 'all',
    preview_branch_includes: [],
    preview_branch_excludes: [],
    repo_name: 'Sekret-Bip',
    ...(overrides.sourceConfig || {}),
  };
  return {
    name: 'sekret-bip',
    production_branch: 'main',
    domains: ['app.sekretbip.net', 'sekret-bip.pages.dev'],
    source: {
      type: 'github',
      config: sourceConfig,
    },
    ...overrides,
    source: overrides.source === null
      ? null
      : {
          type: overrides.sourceType || 'github',
          config: sourceConfig,
        },
  };
}

test('accepts canonical GitHub Pages project with main production and canonical domain', () => {
  const verdict = evaluatePagesBranchAuthority(project());
  assert.equal(verdict.verified, true);
  assert.deepEqual(verdict.failures, []);
  assert.equal(verdict.observed.name, 'sekret-bip');
  assert.equal(verdict.observed.repoOwner, 'jussray');
  assert.equal(verdict.observed.repoName, 'Sekret-Bip');
  assert.ok(verdict.observed.domains.includes('app.sekretbip.net'));
  assert.equal(verdict.observed.productionBranch, 'main');
  assert.equal(verdict.observed.productionDeploymentsEnabled, true);
  assert.equal(verdict.observed.previewDeploymentSetting, 'all');
});

test('rejects a Pages project connected to the wrong GitHub owner', () => {
  const verdict = evaluatePagesBranchAuthority(project({
    sourceConfig: { owner: 'someone-else' },
  }));
  assert.equal(verdict.verified, false);
  assert.ok(verdict.failures.includes('repo-owner:someone-else'));
});

test('rejects a Pages project connected to the wrong GitHub repository', () => {
  const verdict = evaluatePagesBranchAuthority(project({
    sourceConfig: { repo_name: 'not-sekret-bip' },
  }));
  assert.equal(verdict.verified, false);
  assert.ok(verdict.failures.includes('repo-name:not-sekret-bip'));
});

test('rejects a Pages project missing the canonical app domain', () => {
  const verdict = evaluatePagesBranchAuthority(project({
    domains: ['sekret-bip.pages.dev'],
  }));
  assert.equal(verdict.verified, false);
  assert.ok(verdict.failures.includes('canonical-domain:app.sekretbip.net:missing'));
});

test('rejects a non-main Pages production branch', () => {
  const verdict = evaluatePagesBranchAuthority(project({ production_branch: 'develop' }));
  assert.equal(verdict.verified, false);
  assert.ok(verdict.failures.includes('production-branch:develop'));
});

test('rejects disabled automatic production deployments', () => {
  const verdict = evaluatePagesBranchAuthority(project({
    sourceConfig: { production_deployments_enabled: false },
  }));
  assert.equal(verdict.verified, false);
  assert.ok(verdict.failures.includes('production-deployments-enabled:false'));
});

test('rejects a Pages project without GitHub source authority', () => {
  const verdict = evaluatePagesBranchAuthority(project({ source: null }));
  assert.equal(verdict.verified, false);
  assert.ok(verdict.failures.includes('source-type:missing'));
});

test('accepts custom preview branch controls while keeping canonical production authority', () => {
  const verdict = evaluatePagesBranchAuthority(project({
    sourceConfig: {
      preview_deployment_setting: 'custom',
      preview_branch_includes: ['preview/*'],
      preview_branch_excludes: ['main'],
    },
  }));
  assert.equal(verdict.verified, true);
  assert.equal(verdict.observed.previewDeploymentSetting, 'custom');
  assert.deepEqual(verdict.observed.previewBranchIncludes, ['preview/*']);
});

test('fingerprint changes when load-bearing Pages authority changes', () => {
  const first = normalizePagesProject(project());
  const second = normalizePagesProject(project({
    sourceConfig: { repo_name: 'not-sekret-bip' },
  }));
  assert.notEqual(fingerprintPagesAuthority(first), fingerprintPagesAuthority(second));
});
