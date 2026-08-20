import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {classifyProductionImpact} from '../scripts/classify-production-impact.mjs';

const workflow = readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

test('Cloudflare native deployment verifier is credential-minimal and action-pinned', () => {
  for (const required of [
    'ref: ${{ env.DEPLOYMENT_SHA }}',
    'persist-credentials: false',
    'test "$actual" = "$EXPECTED_RELEASE_SHA"',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    'environment: Production',
    'RELEASE_OBSERVATION_MODE: blocked',
  ]) {
    assert.ok(workflow.includes(required), `missing deployment workflow contract: ${required}`);
  }

  assert.ok(!/uses:\s+actions\/(?:checkout|setup-node|upload-artifact)@v\d+/u.test(workflow), 'production verifier actions must be SHA-pinned');
  assert.ok(!workflow.includes('persist-credentials: true'), 'production verifier checkout credentials must not persist');
});

test('production verification classifies every main push instead of relying on a drifting positive path list', () => {
  for (const required of [
    'classify-production-impact:',
    'fetch-depth: 0',
    'needs: classify-production-impact',
    "needs.classify-production-impact.outputs.production_impact != 'false'",
  ]) {
    assert.ok(workflow.includes(required), `missing scope-aware deployment contract: ${required}`);
  }

  assert.doesNotMatch(workflow, /push:\s*\n\s*branches: \[main\]\s*\n\s*paths:/u);
});

test('main-push classification executes the previous trusted main classifier, never target-controlled classifier code', () => {
  for (const required of [
    'trusted_classifier="$RUNNER_TEMP/classify-production-impact.mjs"',
    'git show "$BEFORE_SHA:scripts/classify-production-impact.mjs" > "$trusted_classifier"',
    'node "$trusted_classifier"',
    'reason=trusted-classifier-unavailable',
  ]) {
    assert.ok(workflow.includes(required), `missing trusted-classifier boundary: ${required}`);
  }

  assert.doesNotMatch(
    workflow,
    /classification="\$\(printf '%s\\n' "\$changed_paths" \| node scripts\/classify-production-impact\.mjs\)"/u,
  );
});

test('sandbox-only merge is positively classified as non-production-only', () => {
  const result = classifyProductionImpact([
    '.github/workflows/cloudflare-sandbox-exact-head.yml',
    'test/cloudflare-sandbox-contract.test.mjs',
    'tools/cloudflare-sandbox/Dockerfile',
    'tools/cloudflare-sandbox/README.md',
    'tools/cloudflare-sandbox/package.json',
    'tools/cloudflare-sandbox/src/index.ts',
    'tools/cloudflare-sandbox/tsconfig.json',
    'tools/cloudflare-sandbox/wrangler.jsonc',
  ]);

  assert.equal(result.productionImpact, false);
  assert.equal(result.reason, 'verified-non-production-only');
});

test('build inputs and unknown paths fail closed as production-impacting', () => {
  for (const path of [
    '.node-version',
    '.npmrc',
    '.env.production',
    'babel.config.js',
    'metro.config.js',
    'tsconfig.json',
    'scripts/playwright-executable.mjs',
    'supabase/migrations/20260820190000_example.sql',
    'hooks/useSession.ts',
    'utils/runtime.ts',
    'public/icon.png',
    'future-runtime/new-entry.ts',
  ]) {
    const result = classifyProductionImpact([path]);
    assert.equal(result.productionImpact, true, `${path} must fail closed as production-impacting`);
  }
});

test('mixed changes are production-impacting even when most paths are documentation or tests', () => {
  const result = classifyProductionImpact([
    'docs/CURRENT_STATUS.md',
    'test/some-contract.test.mjs',
    'worker/voice-entry.ts',
  ]);

  assert.equal(result.productionImpact, true);
  assert.deepEqual(result.productionPaths, ['worker/voice-entry.ts']);
});

test('empty or malformed path evidence fails closed', () => {
  assert.equal(classifyProductionImpact([]).productionImpact, true);
  assert.equal(classifyProductionImpact(['../worker/voice-entry.ts']).productionImpact, true);
  assert.equal(classifyProductionImpact(['C:\\worker\\voice-entry.ts']).productionImpact, true);
});

test('classifier CLI works when invoked through a relative script path', () => {
  const nonProduction = spawnSync(process.execPath, ['scripts/classify-production-impact.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    input: 'docs/CURRENT_STATUS.md\ntest/example.test.mjs\n',
  });
  assert.equal(nonProduction.status, 0, nonProduction.stderr);
  assert.equal(nonProduction.stdout.trim(), 'false');

  const production = spawnSync(process.execPath, ['scripts/classify-production-impact.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    input: '.node-version\n',
  });
  assert.equal(production.status, 0, production.stderr);
  assert.equal(production.stdout.trim(), 'true');
});
