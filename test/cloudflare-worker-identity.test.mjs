import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const wrangler = read('wrangler.toml');
const workflow = read('.github/workflows/deploy-cloudflare.yml');
const eas = JSON.parse(read('eas.json'));

const WORKER_NAME = 'sekret-backend';
const WORKER_URL = 'https://sekret-backend.mcgill-raylene.workers.dev';

 test('Wrangler targets the canonical Worker name', () => {
  assert.match(wrangler, new RegExp(`^name = "${WORKER_NAME}"$`, 'm'));
});

test('production verification requires the canonical native Worker deployment', () => {
  assert.ok(workflow.includes(`Workers Builds: ${WORKER_NAME}`));
  assert.ok(workflow.includes(`${WORKER_URL}/health`));
  assert.ok(workflow.includes('Cloudflare Pages'));
  assert.ok(workflow.includes('checks: read'));
});

test('GitHub Actions does not require Cloudflare deployment credentials', () => {
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false);
  assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false);
  assert.equal(workflow.includes('wrangler deploy'), false);
  assert.equal(workflow.includes('wrangler pages deploy'), false);
});

test('all EAS profiles point to the canonical Worker URL', () => {
  for (const [profileName, profile] of Object.entries(eas.build)) {
    assert.equal(
      profile.env?.EXPO_PUBLIC_BACKEND_URL,
      WORKER_URL,
      `${profileName} must point to ${WORKER_URL}`,
    );
  }
});
