import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');
const productionSmoke = readFileSync('e2e/production-smoke.spec.ts', 'utf8');

test('production verification runs after relevant main pushes', () => {
  assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /EXPECTED_RELEASE_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /verify-cloudflare-native-deploy\.mjs/);
  assert.match(workflow, /test:e2e:production/);
});

test('production Playwright verifies both public variants and their Enter paths', () => {
  assert.match(productionSmoke, /web-welcome-hero-teen/);
  assert.match(productionSmoke, /web-welcome-hero-bip-jr/);
  assert.match(productionSmoke, /How old are you\?/);
  assert.match(productionSmoke, /enter your parent space/);
  assert.match(productionSmoke, /web-welcome-suhana/);
  assert.match(productionSmoke, /toHaveText\('Suhana'\)/);
});
