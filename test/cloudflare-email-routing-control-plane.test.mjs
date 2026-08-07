import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  EMAIL_ALIASES,
  buildWorkerRule,
  configFromEnv,
} from '../scripts/reconcile-cloudflare-email-routing.mjs';

const REQUIRED_ALIASES = [
  'hello',
  'founder',
  'partnerships',
  'support',
  'parents',
  'safety',
  'privacy',
  'legal',
  'security',
];

test('Cloudflare email control plane preserves the canonical alias set', () => {
  assert.deepEqual(EMAIL_ALIASES, REQUIRED_ALIASES);

  const router = fs.readFileSync(new URL('../worker/email-router.ts', import.meta.url), 'utf8');
  for (const alias of REQUIRED_ALIASES) {
    assert.match(router, new RegExp(`\\b${alias}:`));
  }
});

test('Cloudflare email rules target the canonical production Worker', () => {
  const config = configFromEnv({});
  const rule = buildWorkerRule('founder', config);

  assert.equal(config.zoneName, 'sekretbip.net');
  assert.equal(config.workerName, 'sekret-backend');
  assert.equal(config.destinationEmail, 'sekretbip@gmail.com');
  assert.deepEqual(rule.matchers, [
    { type: 'literal', field: 'to', value: 'founder@sekretbip.net' },
  ]);
  assert.deepEqual(rule.actions, [{ type: 'worker', value: ['sekret-backend'] }]);
  assert.equal(rule.enabled, true);
});

test('email routing workflow is manual and does not create a catch-all path', () => {
  const workflow = fs.readFileSync(
    new URL('../.github/workflows/cloudflare-email-routing.yml', import.meta.url),
    'utf8',
  );
  const reconciler = fs.readFileSync(
    new URL('../scripts/reconcile-cloudflare-email-routing.mjs', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*push:/m);
  assert.doesNotMatch(workflow, /^\s*schedule:/m);
  assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(reconciler, /catchAll: false/);
  assert.doesNotMatch(reconciler, /method:\s*['"]DELETE['"]/);
});
