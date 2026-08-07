import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const workflow = fs.readFileSync(path.join(root, '.github/workflows/controlled-account-cloud-comfort.yml'), 'utf8');
const config = fs.readFileSync(path.join(root, 'playwright.controlled-account.config.ts'), 'utf8');
const spec = fs.readFileSync(path.join(root, 'e2e/controlled-account-cloud-comfort.spec.ts'), 'utf8');

test('controlled-account proof is manual-only and exact-production bound', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  pull_request:/);
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /confirm_controlled_account_use:/);
  assert.match(workflow, /EXPECTED_HEAD_SHA: \$\{\{ inputs\.target_sha \}\}/);
  assert.match(workflow, /https:\/\/sekretbip\.net\/\.well-known\/sekret-release\.json/);
  assert.match(workflow, /body\?\.environment === 'production'/);
  assert.match(workflow, /body\?\.branch === 'main'/);
  assert.match(workflow, /test \"\$actual\" = \"\$EXPECTED_HEAD_SHA\"/);
});

test('controlled-account proof requires masked repository secrets and never creates an account', () => {
  assert.match(workflow, /secrets\.SEKRET_CONTROLLED_ACCOUNT_EMAIL/);
  assert.match(workflow, /secrets\.SEKRET_CONTROLLED_ACCOUNT_PASSWORD/);
  assert.match(workflow, /CONFIRM_CONTROLLED_ACCOUNT_USE/);
  assert.doesNotMatch(workflow, /auth\/v1\/signup|live-signup-mailbox|create account/i);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY|CLOUDFLARE_API_TOKEN|wrangler deploy/);
  assert.doesNotMatch(spec, /writeReceipt\([\s\S]*(?:controlledEmail|controlledPassword)/);
});

test('controlled-account browser proof disables sensitive capture surfaces', () => {
  assert.match(config, /trace: 'off'/);
  assert.match(config, /screenshot: 'off'/);
  assert.match(config, /video: 'off'/);
  assert.match(config, /reporter: 'line'/);
  assert.match(config, /workers: 1/);
  assert.match(config, /retries: 0/);
  assert.doesNotMatch(spec, /page\.screenshot|test\.info\(\)\.attach|trace\.zip/);
});

test('Cloud proof uses synthetic content and blocks provider leakage during recovery', () => {
  assert.match(spec, /CI synthetic success check/);
  assert.match(spec, /Controlled synthetic reply\./);
  assert.match(spec, /page\.route\('\*\*\/api\/sekret\/reply'/);
  assert.match(spec, /context\.setOffline\(true\)/);
  assert.match(spec, /Are you real\?/);
  assert.match(spec, /syntheticCloudContentOnly: true/);
  assert.match(spec, /privateUserContentUsed: false/);
});

test('Comfort proof checks authenticated controls without emitting completion', () => {
  assert.match(spec, /comfort-step-1/);
  assert.match(spec, /comfort-step-4/);
  assert.match(spec, /Open Calm Space and finish this Comfort visit/);
  assert.match(spec, /Finish this Comfort visit and return home/);
  assert.doesNotMatch(spec, /comfort_completed|finishComfort/);
});

test('uploaded receipt is sanitized and excludes browser reports', () => {
  assert.match(workflow, /path: artifacts\/controlled-account-cloud-comfort\.json/);
  assert.doesNotMatch(workflow, /playwright-report|test-results|trace/);
  assert.match(spec, /credentialValuesWrittenToReceipt: false/);
  assert.match(spec, /screenshotsCaptured: false/);
  assert.match(spec, /traceCaptured: false/);
  assert.match(spec, /videoCaptured: false/);
});
