import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ALWAYS_REQUIRED_CHECKS,
  evaluateExpectedChecks,
  expectedChecksForChangedFiles,
  extractPullRequestPaths,
  globMatches,
} from '../scripts/verify-github-merge-membrane.mjs';

const SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function run(name, conclusion = 'success', app = 'github-actions', overrides = {}) {
  return {
    id: Math.floor(Math.random() * 100000),
    name,
    head_sha: SHA,
    status: 'completed',
    conclusion,
    started_at: '2026-09-05T08:00:00Z',
    completed_at: '2026-09-05T08:01:00Z',
    app: { slug: app },
    ...overrides,
  };
}

test('glob matcher handles exact paths, stars, and recursive prefixes', () => {
  assert.equal(globMatches('src/a.ts', 'src/**'), true);
  assert.equal(globMatches('src/nested/a.ts', 'src/**'), true);
  assert.equal(globMatches('src/a.ts', 'src/*.ts'), true);
  assert.equal(globMatches('src/nested/a.ts', 'src/*.ts'), false);
  assert.equal(globMatches('wrangler.toml', 'wrangler.toml'), true);
  assert.equal(globMatches('docs/readme.md', 'wrangler.toml'), false);
});

test('path parser understands the current proof workflow contracts', () => {
  const productSource = readFileSync('.github/workflows/product-design-playwright-proof.yml', 'utf8');
  const shieldSource = readFileSync('.github/workflows/founder-shield.yml', 'utf8');
  const productPaths = extractPullRequestPaths(productSource);
  const shieldPaths = extractPullRequestPaths(shieldSource);

  assert.ok(productPaths.includes('src/**'));
  assert.ok(productPaths.includes('.github/workflows/founder-shield.yml'));
  assert.ok(shieldPaths.includes('worker/auth.ts'));
  assert.ok(shieldPaths.includes('.github/workflows/founder-shield.yml'));
});

test('docs-only changes require the universal machine membrane without inventing Playwright work', () => {
  const expected = expectedChecksForChangedFiles(['docs/example.md'], {
    '.github/workflows/product-design-playwright-proof.yml': ['src/**'],
    '.github/workflows/founder-shield.yml': ['worker/**'],
  });

  assert.deepEqual(expected, [...ALWAYS_REQUIRED_CHECKS]);
});

test('rendered and security changes require their path-sensitive proof checks', () => {
  const patterns = {
    '.github/workflows/product-design-playwright-proof.yml': ['src/**', 'worker/**', '.github/workflows/founder-shield.yml'],
    '.github/workflows/founder-shield.yml': ['worker/**', '.github/workflows/founder-shield.yml'],
  };

  assert.deepEqual(
    expectedChecksForChangedFiles(['src/screens/Home.tsx'], patterns),
    [...ALWAYS_REQUIRED_CHECKS, 'product-design-proof'],
  );

  assert.deepEqual(
    expectedChecksForChangedFiles(['worker/auth.ts'], patterns),
    [...ALWAYS_REQUIRED_CHECKS, 'product-design-proof', 'verify-founder-shield'],
  );
});

test('a PR cannot weaken its own conditional proof scope to avoid that proof', () => {
  const trustedBasePatterns = {
    '.github/workflows/product-design-playwright-proof.yml': ['src/**'],
    '.github/workflows/founder-shield.yml': ['worker/**'],
  };

  assert.deepEqual(
    expectedChecksForChangedFiles(
      ['.github/workflows/product-design-playwright-proof.yml'],
      trustedBasePatterns,
    ),
    [...ALWAYS_REQUIRED_CHECKS, 'product-design-proof'],
  );

  assert.deepEqual(
    expectedChecksForChangedFiles(
      ['.github/workflows/founder-shield.yml'],
      trustedBasePatterns,
    ),
    [...ALWAYS_REQUIRED_CHECKS, 'verify-founder-shield'],
  );
});

test('exact-head trusted GitHub Actions checks must all exist and pass', () => {
  const expectedChecks = [...ALWAYS_REQUIRED_CHECKS, 'product-design-proof'];
  const good = expectedChecks.map((name) => run(name));

  const passed = evaluateExpectedChecks({ expectedChecks, checkRuns: good, expectedSha: SHA });
  assert.equal(passed.ready, true);
  assert.deepEqual(passed.failed, []);
  assert.deepEqual(passed.missing, []);

  const spoofed = good.filter((item) => item.name !== 'product-design-proof');
  spoofed.push(run('product-design-proof', 'success', 'cloudflare-workers-and-pages'));
  const spoofedVerdict = evaluateExpectedChecks({ expectedChecks, checkRuns: spoofed, expectedSha: SHA });
  assert.equal(spoofedVerdict.ready, false);
  assert.deepEqual(spoofedVerdict.missing, ['product-design-proof']);

  const failed = good.map((item) => item.name === 'repository-truth' ? run(item.name, 'failure') : item);
  const failedVerdict = evaluateExpectedChecks({ expectedChecks, checkRuns: failed, expectedSha: SHA });
  assert.equal(failedVerdict.terminalFailure, true);
  assert.deepEqual(failedVerdict.failed, ['repository-truth']);
});

test('stale-head success cannot satisfy current-head authority', () => {
  const expectedChecks = [...ALWAYS_REQUIRED_CHECKS];
  const stale = expectedChecks.map((name) => run(name, 'success', 'github-actions', {
    head_sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  }));

  const verdict = evaluateExpectedChecks({ expectedChecks, checkRuns: stale, expectedSha: SHA });
  assert.equal(verdict.ready, false);
  assert.deepEqual(verdict.missing, expectedChecks);
});
