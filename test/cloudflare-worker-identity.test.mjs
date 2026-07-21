import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const wrangler = read('wrangler.toml');
const workflow = read('.github/workflows/deploy-cloudflare.yml');
const verifier = read('scripts/verify-cloudflare-native-deploy.mjs');
const packageJson = JSON.parse(read('package.json'));
const eas = JSON.parse(read('eas.json'));

const WORKER_NAME = 'sekret-backend';
const WORKER_URL = 'https://sekret-backend.mcgill-raylene.workers.dev';
const ALPHA_WORKER_URL = 'https://sekret-backend-alpha.mcgill-raylene.workers.dev';
// Founder-approved controlled-alpha isolation (wrangler.alpha.toml,
// docs/CLOUDFLARE_OWNERSHIP.md, reports/control-room/founder-operator/
// 20260718-controlled-alpha-activation/system-map.md): preview builds
// deliberately route to the distinct, non-production sekret-backend-alpha
// Worker instead of the canonical one.
const ALPHA_ROUTED_PROFILES = new Set(['preview', 'parent-preview']);

 test('Wrangler targets the canonical Worker name', () => {
  assert.match(wrangler, new RegExp(`^name = "${WORKER_NAME}"$`, 'm'));
});

test('production verification proves the exact Worker and Pages release', () => {
  assert.ok(workflow.includes('npm run test:e2e:production'));
  assert.ok(workflow.includes('scripts/verify-cloudflare-native-deploy.mjs'));
  assert.ok(workflow.includes(`${WORKER_URL}/health`));
  assert.ok(workflow.includes('https://sekretbip.net/release.json'));
  assert.ok(workflow.includes('EXPECTED_RELEASE_SHA: ${{ github.sha }}'));
  assert.ok(workflow.includes('checks: read'));
  assert.ok(verifier.includes(`Workers Builds: ${WORKER_NAME}`));
  assert.ok(verifier.includes('Pages release marker'));
  assert.ok(packageJson.scripts['build:web'].includes('write-release-metadata.mjs'));
});

test('only the newest main release verifier remains active', () => {
  assert.ok(workflow.includes('group: cloudflare-native-production'));
  assert.ok(workflow.includes('cancel-in-progress: true'));
  assert.equal(workflow.includes('github.sha }}'), true);
});

test('GitHub Actions does not require Cloudflare deployment credentials', () => {
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false);
  assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false);
  assert.equal(workflow.includes('wrangler deploy'), false);
  assert.equal(workflow.includes('wrangler pages deploy'), false);
});

test('all EAS profiles point to the canonical Worker URL, except the approved controlled-alpha preview isolation', () => {
  for (const [profileName, profile] of Object.entries(eas.build)) {
    const expected = ALPHA_ROUTED_PROFILES.has(profileName) ? ALPHA_WORKER_URL : WORKER_URL;
    assert.equal(
      profile.env?.EXPO_PUBLIC_BACKEND_URL,
      expected,
      `${profileName} must point to ${expected}`,
    );
  }
});
