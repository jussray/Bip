import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const specPath = path.join(root, 'e2e/live-onboarding-email.spec.ts');
const packagePath = path.join(root, 'package.json');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('live onboarding email smoke is explicit opt-in only', () => {
  const source = readText(specPath);

  assert.match(source, /LIVE_ONBOARDING_PHASE/);
  assert.match(source, /LIVE_ONBOARDING_EMAIL/);
  assert.match(source, /LIVE_PARENT_INVITE_EMAIL/);
  assert.match(source, /test\.skip\(!shouldRunSignup/);
  assert.match(source, /test\.skip\(!shouldRunInvite/);
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

test('package exposes the founder-assisted live onboarding email command', () => {
  const pkg = JSON.parse(readText(packagePath));

  assert.equal(
    pkg.scripts['test:e2e:live-onboarding-email'],
    'playwright test --config=playwright.production.config.ts e2e/live-onboarding-email.spec.ts',
  );
});
