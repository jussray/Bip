import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  backendHealthIdentityMatches,
  classifyWorkerBindings,
  routePatternMayMatchHost,
  routePatternTargetsExactHost,
  validateResolvedZone,
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
  assert.equal(classified.broadRoutes.length, 0);
});

test('every broad route matching the app hostname is surfaced regardless of Worker owner', () => {
  const classified = classifyWorkerBindings(
    {
      domains: [
        { id: 'foreign-domain', hostname: 'app.sekretbip.net', service: 'legacy-worker' },
      ],
      routes: [
        { id: 'owned-wildcard', pattern: '*.sekretbip.net/*', script: 'sekret-backend' },
        { id: 'foreign-wildcard', pattern: 'app.*/*', script: 'legacy-worker' },
        { id: 'foreign-route', pattern: 'app.sekretbip.net/*', script: 'legacy-worker' },
      ],
    },
    config,
  );

  assert.deepEqual(classified.foreignDomains.map((item) => item.id), ['foreign-domain']);
  assert.deepEqual(classified.foreignExactRoutes.map((item) => item.id), ['foreign-route']);
  assert.deepEqual(
    classified.broadRoutes.map((item) => item.id),
    ['owned-wildcard', 'foreign-wildcard'],
  );
});

test('pinned zone and account IDs must match the resolved Cloudflare zone', () => {
  const resolved = validateResolvedZone(
    {
      zoneName: 'sekretbip.net',
      zoneId: 'zone-1',
      accountId: 'account-1',
    },
    {
      id: 'zone-1',
      name: 'sekretbip.net',
      account: { id: 'account-1' },
    },
  );

  assert.equal(resolved.zoneId, 'zone-1');
  assert.equal(resolved.accountId, 'account-1');

  assert.throws(
    () =>
      validateResolvedZone(
        { zoneName: 'sekretbip.net', zoneId: 'zone-wrong', accountId: 'account-1' },
        { id: 'zone-1', name: 'sekretbip.net', account: { id: 'account-1' } },
      ),
    /ZONE_ID_MISMATCH/,
  );

  assert.throws(
    () =>
      validateResolvedZone(
        { zoneName: 'sekretbip.net', zoneId: 'zone-1', accountId: 'account-wrong' },
        { id: 'zone-1', name: 'sekretbip.net', account: { id: 'account-1' } },
      ),
    /ACCOUNT_ID_MISMATCH/,
  );
});

test('backend health proof requires the canonical Worker identity', () => {
  assert.equal(
    backendHealthIdentityMatches({ ok: true, worker: 'sekret-backend' }, 'sekret-backend'),
    true,
  );
  assert.equal(
    backendHealthIdentityMatches({ ok: true, worker: 'other-worker' }, 'sekret-backend'),
    false,
  );
  assert.equal(
    backendHealthIdentityMatches({ ok: false, worker: 'sekret-backend' }, 'sekret-backend'),
    false,
  );
  assert.equal(backendHealthIdentityMatches(null, 'sekret-backend'), false);
});

test('production reconciler workflow runs safety checks on PRs and keeps provider mutation dispatch-only', () => {
  const workflow = fs.readFileSync(
    new URL('../.github/workflows/reconcile-cloudflare-app-domain.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /pull_request:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /workflow_dispatch:\s*\n\s+inputs:/);
  assert.match(workflow, /Verify focused route reconciler contract/);
  assert.match(workflow, /node --test test\/cloudflare-app-domain-reconciler\.test\.mjs/);
  assert.match(workflow, /apply:/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' && inputs\.apply == true/);
  assert.doesNotMatch(workflow, /github\.event_name == 'push' \|\| inputs\.apply == true/);
  assert.doesNotMatch(workflow, /github\.event_name == 'pull_request' \|\| inputs\.apply == true/);
  assert.match(workflow, /current_main/);
  assert.match(workflow, /test "\$GITHUB_SHA" = "\$current_main"/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /reconcile-cloudflare-app-domain\.mjs --apply/);
  assert.match(workflow, /cloudflare-app-domain-routing-evidence/);
});

test('confirmed provider mutations are persisted before post-apply verification can fail', () => {
  const reconciler = fs.readFileSync(
    new URL('../scripts/reconcile-cloudflare-app-domain.mjs', import.meta.url),
    'utf8',
  );

  assert.match(reconciler, /persistMutationProgress\(context, actions\)/);
  assert.match(reconciler, /persistMutationProgress\(context, actions, 'apply-failed'\)/);
  assert.match(reconciler, /phase = 'apply-in-progress'/);
  assert.match(reconciler, /actions:\s*\[\.\.\.actions\]/);
});

test('top-level failure logging never echoes caught exception text', () => {
  const reconciler = fs.readFileSync(
    new URL('../scripts/reconcile-cloudflare-app-domain.mjs', import.meta.url),
    'utf8',
  );

  assert.match(reconciler, /console\.error\('CLOUDFLARE_APP_DOMAIN_RECONCILIATION_FAILED'\)/);
  assert.doesNotMatch(reconciler, /console\.error\([^\n]*(?:error\.message|String\(error\)|\berror\b)/);
});
