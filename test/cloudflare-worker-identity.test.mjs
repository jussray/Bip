import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const wrangler = read('wrangler.toml');
const workflow = read('.github/workflows/deploy-cloudflare.yml');
const eas = JSON.parse(read('eas.json'));
const ownership = read('docs/CLOUDFLARE_OWNERSHIP.md');
const envExample = read('.env.example');

const WORKER_NAME = 'sekret-bip';
const WORKER_URL = 'https://sekret-bip.mcgill-raylene.workers.dev';

test('Wrangler and deployment workflow target the same Worker', () => {
  assert.match(wrangler, new RegExp(`^name = "${WORKER_NAME}"$`, 'm'));
  assert.match(workflow, new RegExp(`name = "${WORKER_NAME}"`));
  assert.match(workflow, new RegExp(`Deploy backend Worker ${WORKER_NAME}`));
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

test('ownership and environment docs use the canonical Worker identity', () => {
  assert.match(ownership, /### `sekret-bip` — backend Worker/);
  assert.match(ownership, new RegExp(WORKER_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(ownership, /Cloudflare Worker: bip\b/);
  assert.match(envExample, /EXPO_PUBLIC_BACKEND_URL=https:\/\/sekret-bip\.your-subdomain\.workers\.dev/);
  assert.match(envExample, /wrangler secret put OPENAI_API_KEY --name sekret-bip/);
});
