import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const specPath = path.join(root, 'e2e/live-onboarding-email.spec.ts');
const liveConfigPath = path.join(root, 'playwright.live-onboarding.config.ts');
const workflowPath = path.join(root, '.github/workflows/live-signup-proof.yml');
const mailboxPath = path.join(root, 'scripts/live-signup-mailbox.mjs');
const signupSourcePath = path.join(root, 'app/(auth)/signup.tsx');

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
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.match(workflow, /group: live-signup-proof-\$\{\{ github\.repository \}\}/);
  assert.match(workflow, /git log -1 --pretty=%B \| grep -Fq '\[live-signup-proof\]'/);
  assert.match(workflow, /steps\.opt_in\.outputs\.enabled == 'true'/);
  assert.doesNotMatch(workflow, /wrangler deploy|deploy:web:production|deploy:api:production/);
});

test('opaque 504 signup responses enter the existing ambiguous recovery path', () => {
  const source = readText(signupSourcePath);

  assert.match(source, /function authErrorStatus\(error: unknown\): number \| null/);
  assert.match(source, /if \(authErrorStatus\(error\) === 504\) return true;/);
  assert.match(source, /const status = authErrorStatus\(error\);\s*return status !== null && status >= 400;/);
  assert.match(source, /if \(isAmbiguousSignupError\(authErr\)\) \{[\s\S]*recoverAmbiguousSignup\(sb, e, p, metadata, authErr\)/);
  assert.match(source, /The account server received your signup request, but confirmation is delayed/);
});

test('live signup tolerates bounded Auth latency and distinguishes transport noise from page failures', () => {
  const source = readText(specPath);

  assert.match(source, /test\.setTimeout\(180_000\)/);
  assert.match(source, /authObservations/);
  assert.match(source, /networkConsoleErrors/);
  assert.match(source, /pageErrors/);
  assert.match(source, /page\.on\('pageerror'/);
  assert.match(source, /signup should leave its pending state/);
  assert.match(source, /timeout: 120_000/);
  assert.match(source, /getByText\('Check your email', \{ exact: true \}\)/);
  assert.match(source, /authObservations\.some\(\(observation\) => observation\.path\.endsWith\('\/signup'\)\)/);
  assert.match(source, /expect\(pageErrors\)\.toEqual\(\[\]\)/);
  assert.doesNotMatch(source, /expect\(consoleErrors\)\.toEqual\(\[\]\)/);
  assert.doesNotMatch(source, /getByText\(\/consent\|privacy\|continue\/i\)/);
});

test('live onboarding email smoke proves returning-user authentication with bounded retries', () => {
  const source = readText(specPath);

  assert.match(source, /LIVE_SIGNIN_ATTEMPTS/);
  assert.match(source, /LIVE_SIGNIN_RETRY_MS/);
  assert.match(source, /authenticated_returning_user/);
  assert.match(source, /expect\(signedIn,[\s\S]*Returning teen sign-in never completed/);
  assert.match(source, /not\.toHaveURL\(\/\\\/login/);
});

test('live signup proof uses a dedicated exact-target Playwright config', () => {
  const config = readText(liveConfigPath);
  const workflow = readText(workflowPath);

  assert.match(config, /LIVE_ONBOARDING_BASE_URL/);
  assert.match(config, /PRODUCTION_BASE_URL/);
  assert.match(config, /testMatch: \['live-onboarding-email\.spec\.ts'\]/);
  assert.match(config, /timeout: 120_000/);
  assert.match(config, /workers: 1/);
  assert.match(config, /retries: 0/);
  assert.doesNotMatch(config, /production-smoke\.spec\.ts|production-signup-transport\.spec\.ts/);
  assert.match(workflow, /npx playwright test --config=playwright\.live-onboarding\.config\.ts/);
});

test('PR live signup proof fails closed until an isolated exact-head Pages preview exists', () => {
  const workflow = readText(workflowPath);

  assert.match(workflow, /LIVE_ONBOARDING_BASE_URL: https:\/\/fix-production-signup-age-co\.sekret-bip\.pages\.dev/);
  assert.match(workflow, /Verify isolated preview is exact head/);
  assert.match(workflow, /hostname\.endsWith\('\.pages\.dev'\)/);
  assert.match(workflow, /body\?\.commitSha === expected/);
  assert.match(workflow, /body\?\.environment === 'preview'/);
  assert.match(workflow, /Exact isolated preview verified/);
  assert.doesNotMatch(workflow, /LIVE_ONBOARDING_BASE_URL: https:\/\/sekretbip\.net/);
});

test('live signup proof mailbox is disposable, non-personal, single-pass decoded, and cleaned up', () => {
  const workflow = readText(workflowPath);
  const mailbox = readText(mailboxPath);

  assert.match(mailbox, /https:\/\/api\.mail\.tm/);
  assert.match(mailbox, /https:\/\/mail\.tm/);
  assert.match(mailbox, /if \(Array\.isArray\(body\)\) return body;/);
  assert.match(mailbox, /decodeUrlSeparatorsOnce/);
  assert.doesNotMatch(mailbox, /normalizeHtmlEntities/);
  assert.doesNotMatch(mailbox, /replaceAll\('&amp;'/);
  assert.match(mailbox, /\/domains\?page=1/);
  assert.match(mailbox, /\/accounts/);
  assert.match(mailbox, /\/token/);
  assert.match(mailbox, /\/messages\?page=1/);
  assert.match(mailbox, /method: 'DELETE'/);
  assert.match(workflow, /live-signup-mailbox\.mjs create/);
  assert.match(workflow, /live-signup-mailbox\.mjs confirm/);
  assert.match(workflow, /live-signup-mailbox\.mjs cleanup/);
  assert.doesNotMatch(workflow, /@gmail\.com/i);
  assert.doesNotMatch(mailbox, /@gmail\.com/i);

  const previewStep = workflow.indexOf('Verify isolated preview is exact head');
  const mailboxStep = workflow.indexOf('Prepare disposable guest identity and mailbox');
  const signupStep = workflow.indexOf('Create disposable account through exact preview UI');
  const confirmStep = workflow.indexOf('Confirm disposable signup email');
  const signInStep = workflow.indexOf('Prove returning-user sign in');
  assert.ok(previewStep >= 0 && previewStep < mailboxStep && mailboxStep < signupStep && signupStep < confirmStep && confirmStep < signInStep);
});

test('live signup proof workflow is exact-head and non-deploying', () => {
  const workflow = readText(workflowPath);

  assert.match(workflow, /EXPECTED_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(workflow, /test \"\$actual\" = \"\$EXPECTED_HEAD_SHA\"/);
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
