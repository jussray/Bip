import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  classifyWorkerBindings,
  routePatternMayMatchHost,
  routePatternTargetsExactHost,
} from '../scripts/reconcile-cloudflare-app-domain.mjs';

const config = {
  hostname: 'app.sekretbip.net',
  workerName: 'sekret-backend',
};

test('exact app hostname Worker routes are selected without widening delete scope', () => {
  assert.equal(routePatternTargetsExactHost('app.sekretbip.net/*', config.hostname), true);
  assert.equal(routePatternTargetsExactHost('https://app.sekretbip.net/*', config.hostname), true);
  assert.equal(routePatternTargetsExactHost('*.sekretbip.net/*', config.hostname), false);
  assert.equal(routePatternMayMatchHost('*.sekretbip.net/*', config.hostname), true);

  const classified = classifyWorkerBindings(
    {
      domains: [
        { id: 'domain-1', hostname: 'app.sekretbip.net', service: 'sekret-backend' },
        { id: 'domain-api', hostname: 'api.sekretbip.net', service: 'sekret-backend' },
      ],
      routes: [
        { id: 'route-1', pattern: 'app.sekretbip.net/*', script: 'sekret-backend' },
        { id: 'route-api', pattern: 'api.sekretbip.net/*', script: 'sekret-backend' },
      ],
    },
    config,
  );

  assert.deepEqual(classified.ownedDomains.map((item) => item.id), ['domain-1']);
  assert.deepEqual(classified.ownedExactRoutes.map((item) => item.id), ['route-1']);
  assert.equal(classified.broadOwnedRoutes.length, 0);
});

test('wildcard and foreign bindings are surfaced for fail-closed review', () => {
  const classified = classifyWorkerBindings(
    {
      domains: [
        { id: 'foreign-domain', hostname: 'app.sekretbip.net', service: 'legacy-worker' },
      ],
      routes: [
        { id: 'wildcard', pattern: '*.sekretbip.net/*', script: 'sekret-backend' },
        { id: 'foreign-route', pattern: 'app.sekretbip.net/*', script: 'legacy-worker' },
      ],
    },
    config,
  );

  assert.deepEqual(classified.foreignDomains.map((item) => item.id), ['foreign-domain']);
  assert.deepEqual(classified.foreignExactRoutes.map((item) => item.id), ['foreign-route']);
  assert.deepEqual(classified.broadOwnedRoutes.map((item) => item.id), ['wildcard']);
});

test('production reconciler workflow is current-main guarded and narrowly triggered', () => {
  const workflow = fs.readFileSync(
    new URL('../.github/workflows/reconcile-cloudflare-app-domain.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /scripts\/reconcile-cloudflare-app-domain\.mjs/);
  assert.match(workflow, /test\/cloudflare-app-domain-reconciler\.test\.mjs/);
  assert.match(workflow, /current_main/);
  assert.match(workflow, /test "\$GITHUB_SHA" = "\$current_main"/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /reconcile-cloudflare-app-domain\.mjs --apply/);
  assert.match(workflow, /cloudflare-app-domain-routing-evidence/);
});

test('top-level failure logging never echoes caught exception text', () => {
  const reconciler = fs.readFileSync(
    new URL('../scripts/reconcile-cloudflare-app-domain.mjs', import.meta.url),
    'utf8',
  );

  assert.match(reconciler, /console\.error\('CLOUDFLARE_APP_DOMAIN_RECONCILIATION_FAILED'\)/);
  assert.doesNotMatch(reconciler, /console\.error\([^\n]*(?:error\.message|String\(error\)|\berror\b)/);
});
