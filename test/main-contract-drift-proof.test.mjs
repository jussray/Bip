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

  assert.equal(targets.production.worker.entrypoint, 'worker/voice-entry.ts');
  assert.match(wrangler, /^main = "worker\/voice-entry\.ts"$/m);
  assert.ok(workflow.includes('https://sekretbip.net/.well-known/sekret-release.json'));
  assert.equal(pkg.scripts['deploy:worker'], 'npm run deploy:api:production');
  assert.equal(pkg.scripts['deploy:api:production'], 'wrangler deploy');
});
