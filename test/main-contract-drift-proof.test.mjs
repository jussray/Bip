import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('current repository authority stays internally consistent', () => {
  const targets = JSON.parse(read('config/cloudflare-targets.json'));
  const wrangler = read('wrangler.toml');
  const workflow = read('.github/workflows/deploy-cloudflare.yml');
  const pkg = JSON.parse(read('package.json'));
  const ownership = read('docs/CLOUDFLARE_OWNERSHIP.md');
  const emailRouting = read('docs/CLOUDFLARE_EMAIL_ROUTING.md');

  assert.equal(targets.production.worker.entrypoint, 'worker/voice-entry.ts');
  assert.match(wrangler, /^main = "worker\/voice-entry\.ts"$/m);
  assert.ok(workflow.includes('https://sekretbip.net/.well-known/sekret-release.json'));
  assert.equal(pkg.scripts['deploy:worker'], 'npm run deploy:api:production');
  assert.equal(
    pkg.scripts['deploy:api:production'],
    'node scripts/assert-production-deploy-branch.mjs && node scripts/deploy-cloudflare-worker.mjs',
  );
  assert.ok(ownership.includes('`worker/voice-entry.ts`'));
  assert.ok(emailRouting.includes('`worker/voice-entry.ts`'));
  assert.ok(!ownership.includes('https://sekretbip.net/release.json'));
});
