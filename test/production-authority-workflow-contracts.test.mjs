import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKOUT_SHA = '11d5960a326750d5838078e36cf38b85af677262';
const SETUP_NODE_SHA = '49933ea5288caeca8642d1e84afbd3f7d6820020';
const UPLOAD_ARTIFACT_SHA = 'ea165f8d65b6e75b540449e92b4886f43607fa02';
const SUPABASE_SETUP_SHA = 'ab058987d8d6c725971f6cf9d0b5c98467e30bd1';

function workflow(name) {
  return fs.readFileSync(path.join(repositoryRoot, '.github/workflows', name), 'utf8');
}

function assertPinnedNodeWorkflow(content) {
  assert.match(content, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(content, /persist-credentials: false/);
  assert.match(content, new RegExp(`actions/setup-node@${SETUP_NODE_SHA}`));
  assert.match(content, new RegExp(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`));
  assert.doesNotMatch(content, /actions\/(?:checkout|setup-node|upload-artifact)@v\d+/);
}

function assertCancelsSupersededRuns(content) {
  assert.match(content, /concurrency:\s*\n\s*group:/);
  assert.match(content, /cancel-in-progress:\s*true/);
}

test('CodeQL proof uses immutable actions, never persists checkout credentials, and cancels stale heads', () => {
  const content = workflow('codeql-pr-alert-proof.yml');

  assertPinnedNodeWorkflow(content);
  assertCancelsSupersededRuns(content);
  assert.match(content, /ref: \$\{\{ env\.EXPECTED_HEAD_SHA \}\}/);
  assert.match(content, /actual="\$\(git rev-parse HEAD\)"/);
});

test('Production Gate contract obeys the same exact-head supply-chain and scheduling boundary it enforces', () => {
  const content = workflow('production-gate-contract.yml');

  assertPinnedNodeWorkflow(content);
  assertCancelsSupersededRuns(content);
  assert.match(content, /ref: \$\{\{ env\.EXPECTED_HEAD_SHA \}\}/);
  assert.match(content, /actual="\$\(git rev-parse HEAD\)"/);
  assert.match(content, /test\/production-authority-workflow-contracts\.test\.mjs/);
});

test('Product Design proof cancels superseded heads instead of building stale UX evidence', () => {
  const content = workflow('product-design-playwright-proof.yml');

  assertPinnedNodeWorkflow(content);
  assertCancelsSupersededRuns(content);
  assert.match(content, /EXPECTED_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
});

test('Founder Shield is credential-minimal, immutable, and cancels superseded heads', () => {
  const content = workflow('founder-shield.yml');

  assert.match(content, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(content, /persist-credentials: false/);
  assert.match(content, new RegExp(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`));
  assert.doesNotMatch(content, /actions\/(?:checkout|upload-artifact)@v\d+/);
  assertCancelsSupersededRuns(content);
  assert.match(content, /ref: \$\{\{ env\.EXPECTED_HEAD_SHA \}\}/);
});

test('routine Supabase production workflow cannot rewrite migration history', () => {
  const content = workflow('deploy-supabase-migrations.yml');

  assert.match(content, /options:\s*\n\s*- dry-run\s*\n\s*- apply/);
  assert.doesNotMatch(content, /normalize-alias/i);
  assert.doesNotMatch(content, /migration repair/i);
  assert.doesNotMatch(content, /canonical_version/i);
  assert.doesNotMatch(content, /execution_version/i);
  assert.match(content, /environment: production/);
});

test('routine Supabase production workflow is exact-main, dry-run-first, and supply-chain pinned', () => {
  const content = workflow('deploy-supabase-migrations.yml');

  assert.match(content, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(content, /persist-credentials: false/);
  assert.match(content, new RegExp(`supabase/setup-cli@${SUPABASE_SETUP_SHA}`));
  assert.match(content, /version: 2\.113\.0/);
  assert.match(content, new RegExp(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`));
  assert.doesNotMatch(content, /(?:actions\/checkout|actions\/upload-artifact|supabase\/setup-cli)@v\d+/);

  const exactTarget = content.indexOf('- name: Verify exact target is current main');
  const dryRun = content.indexOf('- name: Preview production migration plan');
  const preMutation = content.indexOf('- name: Re-verify current main immediately before mutation');
  const apply = content.indexOf('- name: Apply production migrations');
  const postVerify = content.indexOf('- name: Verify exact production schema after mutation');

  assert.ok(exactTarget >= 0);
  assert.ok(dryRun > exactTarget);
  assert.ok(preMutation > dryRun);
  assert.ok(apply > preMutation);
  assert.ok(postVerify > apply);
  assert.match(content, /test "\$TARGET_SHA" = "\$current_main"/);
  assert.match(content, /supabase db push --linked --dry-run/);
  assert.match(content, /supabase db push --linked 2>&1/);
});
