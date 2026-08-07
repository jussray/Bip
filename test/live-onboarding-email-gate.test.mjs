import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const specPath = path.join(root, 'e2e/live-onboarding-email.spec.ts');
const liveConfigPath = path.join(root, 'playwright.live-onboarding.config.ts');
const workflowPath = path.join(root, '.github/workflows/live-signup-proof.yml');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('live onboarding email smoke is explicit opt-in only', () => {
  const source = readText(specPath);
  const workflow = readText(workflowPath);

  assert.match(source, /LIVE_ONBOARDING_PHASE/);
  assert.match(source, /LIVE_ONBOARDING_EMAIL/);
  assert.match(source, /LIVE_PARENT_INVITE_EMAIL/);
  assert.match(source, /test\.skip\(!shouldRunSignup/);
  assert.match(source, /test\.skip\(!shouldRunSignIn/);
  assert.match(source, /test\.skip\(!shouldRunInvite/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /git log -1 --pretty=%B \| grep -Fq '\[live-signup-proof\]'/);
  assert.match(workflow, /steps\.opt_in\.outputs\.enabled == 'true'/);
  assert.doesNotMatch(workflow, /wrangler deploy|deploy:web:production|deploy:api:production/);
});

test('live onboarding email smoke proves returning-user authentication with bounded retries', () => {
  const source = readText(specPath);

  assert.match(source, /LIVE_SIGNIN_ATTEMPTS/);
  assert.match(source, /LIVE_SIGNIN_RETRY_MS/);
  assert.match(source, /authenticated_returning_user/);
  assert.match(source, /expect\(signedIn,[\s\S]*Returning teen sign-in never completed/);
  assert.match(source, /not\.toHaveURL\(\/\\\/login/);
});

test('live signup proof uses a dedicated production Playwright config', () => {
  const config = readText(liveConfigPath);
  const workflow = readText(workflowPath);

  assert.match(config, /PRODUCTION_BASE_URL/);
  assert.match(config, /testMatch: \['live-onboarding-email\.spec\.ts'\]/);
  assert.match(config, /workers: 1/);
  assert.match(config, /retries: 0/);
  assert.doesNotMatch(config, /production-smoke\.spec\.ts|production-signup-transport\.spec\.ts/);
  assert.match(workflow, /npx playwright test --config=playwright\.live-onboarding\.config\.ts/);
});

test('live signup proof workflow is exact-head, disposable, and non-deploying', () => {
  const workflow = readText(workflowPath);

  assert.match(workflow, /EXPECTED_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(workflow, /test \"\$actual\" = \"\$EXPECTED_HEAD_SHA\"/);
  assert.match(workflow, /sekretbip\+pw-\$\{GITHUB_RUN_ID\}@gmail\.com/);
  assert.match(workflow, /randomBytes\(18\)/);
  assert.match(workflow, /LIVE_ONBOARDING_PHASE: signup/);
  assert.match(workflow, /LIVE_ONBOARDING_PHASE: signin/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY|CLOUDFLARE_API_TOKEN|wrangler deploy/);
});

test('live onboarding email smoke proves provider acceptance, not just code generation', () => {
  const source = readText(specPath);

  assert.match(source, /parent-link-create/);
  assert.match(source, /latestInvite\?\.status\)\.toBe\(200\)/);
  assert.match(source, /\.ok\)\.toBe\(true\)/);
  assert.match(source, /\.email\?\.status\)\.toBe\('sent'\)/);
  assert.match(source, /\.email\?\.error_code \?\? null\)\.toBeNull\(\)/);
  assert.doesNotMatch(source, /code created, but email did not send[\s\S]*latestInvite\?\.status\)\.toBeLessThan\(500\)/);
});
