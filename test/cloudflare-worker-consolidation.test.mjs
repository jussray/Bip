import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const targets = JSON.parse(read('config/cloudflare-targets.json'));
const wrangler = read('wrangler.toml');
const voiceEntry = read('worker/voice-entry.ts');
const observedIndex = read('worker/observed-index.ts');
const backendRouter = read('worker/index.ts');
const replyWorker = read('worker/sekret-reply.ts');
const ownership = read('docs/CLOUDFLARE_OWNERSHIP.md');
const emailRouting = read('docs/CLOUDFLARE_EMAIL_ROUTING.md');
const consolidation = read('docs/CLOUDFLARE_WORKER_CONSOLIDATION.md');

const legacyNames = ['bip-mail', 'sekret'];

test('production Cloudflare authority is exactly Pages plus one Worker', () => {
  assert.deepEqual(Object.keys(targets.production).sort(), ['pages', 'worker']);
  assert.equal(targets.production.pages.name, 'sekret-bip');
  assert.equal(targets.production.pages.buildCommand, 'npm run build:web');
  assert.equal(targets.production.pages.outputDirectory, 'dist');
  assert.equal(targets.production.worker.name, 'sekret-backend');
  assert.equal(targets.production.worker.entrypoint, 'worker/voice-entry.ts');
});

test('sekret-backend owns voice, ordinary HTTP, and inbound email handlers', () => {
  assert.match(wrangler, /^name = "sekret-backend"$/m);
  assert.match(wrangler, /^main = "worker\/voice-entry\.ts"$/m);
  assert.ok(voiceEntry.includes("import observedWorker from './observed-index';"));
  assert.ok(voiceEntry.includes("import emailRouter from './email-router';"));
  assert.match(voiceEntry, /async fetch\(/);
  assert.match(voiceEntry, /async email\(/);
  assert.ok(voiceEntry.includes('const response = await observedWorker.fetch(request, downstreamEnv as never, ctx);'));
  assert.ok(voiceEntry.includes('return withSecurityHeaders(response, cors);'));
  assert.ok(voiceEntry.includes('SEKRET_RATE_LIMITER: undefined'));
  assert.ok(voiceEntry.includes('await emailRouter.email(message)'));
  assert.ok(observedIndex.includes("import worker from './index';"));
});

test('Sekret runtime routes remain inside the canonical backend code path', () => {
  assert.ok(backendRouter.includes('/api/sekret/reply'));
  assert.ok(voiceEntry.includes('/api/sekret/voice'));
  assert.ok(replyWorker.includes('/api/sekret/transcribe'));
  assert.ok(backendRouter.includes('/api/bridge/summary/generate'));
  assert.ok(targets.production.worker.roles.includes('sekret-reply'));
  assert.ok(targets.production.worker.roles.includes('inbound-email-routing'));
});

test('legacy dashboard Workers are retirement targets, not deploy targets', () => {
  assert.deepEqual(
    targets.legacyDashboardServices.map((service) => service.name).sort(),
    legacyNames.slice().sort(),
  );

  const wranglerFiles = fs.readdirSync(root).filter((name) => /^wrangler.*\.toml$/.test(name));
  for (const file of wranglerFiles) {
    const content = read(file);
    assert.doesNotMatch(content, /^name = "bip-mail"$/m, `${file} must not deploy bip-mail`);
    assert.doesNotMatch(content, /^name = "sekret"$/m, `${file} must not deploy sekret`);
  }
});

test('documentation requires verified cutover before legacy Worker deletion', () => {
  for (const name of legacyNames) {
    assert.ok(ownership.includes(`\`${name}\``));
    assert.ok(consolidation.includes(`\`${name}\``));
  }

  assert.ok(emailRouting.includes('change the Worker action from `bip-mail` to `sekret-backend`'));
  assert.ok(consolidation.includes('routes and custom domains'));
  assert.ok(consolidation.includes('service bindings'));
  assert.ok(consolidation.includes('recent request volume and error logs'));
  assert.ok(consolidation.includes('Only then delete `bip-mail`'));
  assert.ok(consolidation.includes('then delete `sekret`'));
  assert.ok(consolidation.includes('Founder Control Room records'));
});