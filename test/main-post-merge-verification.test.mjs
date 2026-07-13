import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const qualityGate = read('.github/workflows/quality-gate.yml');
const playwright = read('.github/workflows/playwright.yml');
const ci = read('.github/workflows/ci.yml');
const regression = read('.github/workflows/regression-tests.yml');

function assertPushesToMain(source, name) {
  const onBlock = source.match(/^on:\n([\s\S]*?)\npermissions:/m)?.[1] ?? '';
  assert.match(onBlock, /push:\n\s+branches:\s*\[main\]/, `${name} must run after merges to main`);
}

test('critical quality workflows run on the merged main commit', () => {
  assertPushesToMain(qualityGate, 'Quality Gate');
  assertPushesToMain(playwright, 'Playwright');
  assertPushesToMain(ci, 'CI');
  assert.match(regression, /push:\n\s+branches:\n\s+- main/);
});

test('main verification includes tests, build export, RLS evidence, and browser smoke', () => {
  assert.match(qualityGate, /run: npm test/);
  assert.match(qualityGate, /verify:implementation-ledger/);
  assert.match(qualityGate, /audit:control-room:rls/);
  assert.match(ci, /npm run verify:bundle/);
  assert.match(playwright, /npx playwright test/);
});

test('browser workflow triggers when its own main-push contract changes', () => {
  const pushBlock = playwright.match(/push:\n([\s\S]*?)\n  pull_request:/)?.[1] ?? '';
  assert.match(pushBlock, /'\.github\/workflows\/playwright\.yml'/);
});
