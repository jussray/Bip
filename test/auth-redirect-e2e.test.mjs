import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('auth-redirect Playwright config is isolated from the main e2e config', async () => {
  const config = await read('playwright.auth-redirect.config.ts');
  assert.match(config, /testDir: '\.\/e2e-auth-redirect'/);
  assert.match(config, /const PORT = 4175/);
  assert.doesNotMatch(config, /EXPO_PUBLIC_SUPABASE_URL: '',/);
});

test('auth-redirect config uses a syntactically valid but non-functional Supabase project, never real credentials', async () => {
  const config = await read('playwright.auth-redirect.config.ts');
  assert.match(config, /EXPO_PUBLIC_SUPABASE_URL: 'https:\/\/auth-redirect-test\.supabase\.co'/);
  assert.match(config, /EXPO_PUBLIC_SUPABASE_ANON_KEY: 'auth-redirect-test-placeholder-anon-key'/);
});

test('auth-redirect suite is opt-in, not wired into the default push gate', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.scripts['test:e2e:auth-redirect'], 'playwright test --config=playwright.auth-redirect.config.ts');
  assert.doesNotMatch(pkg.scripts['verify:prepush'], /test:e2e:auth-redirect/);
  assert.doesNotMatch(pkg.scripts['verify:local'] ?? '', /test:e2e:auth-redirect/);
});

test('auth-redirect report output stays out of git', async () => {
  const gitignore = await read('.gitignore');
  assert.match(gitignore, /playwright-report-auth-redirect\//);
});
