import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { classifyAuditDecision } from '../scripts/audit-cloudflare-app-domain-ownership.mjs';

function classification(overrides = {}) {
  return {
    ownedDomains: [],
    foreignDomains: [],
    ownedExactRoutes: [],
    foreignExactRoutes: [],
    broadRoutes: [],
    ...overrides,
  };
}

test('405 plus exact sekret-backend app binding is a bounded provider candidate', () => {
  assert.equal(
    classifyAuditDecision({
      pagesActive: true,
      backendHealthy: true,
      runtime: { status: 405, frontendLike: false, accessIntercepted: false },
      classification: classification({
        ownedExactRoutes: [{ id: 'route-app', pattern: 'app.sekretbip.net/*', script: 'sekret-backend' }],
      }),
    }),
    'bounded-sekret-backend-app-binding-candidate',
  );
});

test('foreign or broad bindings fail closed to manual provider review', () => {
  assert.equal(
    classifyAuditDecision({
      pagesActive: true,
      backendHealthy: true,
      runtime: { status: 405, frontendLike: false, accessIntercepted: false },
      classification: classification({
        foreignDomains: [{ id: 'foreign', service: 'sekret' }],
      }),
    }),
    'manual-provider-review',
  );

  assert.equal(
    classifyAuditDecision({
      pagesActive: true,
      backendHealthy: true,
      runtime: { status: 405, frontendLike: false, accessIntercepted: false },
      classification: classification({
        broadRoutes: [{ id: 'broad', pattern: '*.sekretbip.net/*', script: 'sekret' }],
      }),
    }),
    'manual-provider-review',
  );
});

test('Access interception is never classified as a Worker detach candidate', () => {
  assert.equal(
    classifyAuditDecision({
      pagesActive: true,
      backendHealthy: true,
      runtime: { status: 200, frontendLike: false, accessIntercepted: true },
      classification: classification({
        ownedExactRoutes: [{ id: 'route-app', pattern: 'app.sekretbip.net/*', script: 'sekret-backend' }],
      }),
    }),
    'access-policy-review',
  );
});

test('unexplained interception stays fail-closed when no matching provider binding exists', () => {
  assert.equal(
    classifyAuditDecision({
      pagesActive: true,
      backendHealthy: true,
      runtime: { status: 405, frontendLike: false, accessIntercepted: false },
      classification: classification(),
    }),
    'interceptor-unexplained',
  );
});

test('audit implementation contains no provider mutation method and retains only a body digest', () => {
  const source = fs.readFileSync(
    new URL('../scripts/audit-cloudflare-app-domain-ownership.mjs', import.meta.url),
    'utf8',
  );

  assert.match(source, /method:\s*'GET'/);
  assert.doesNotMatch(source, /method:\s*['"](?:DELETE|POST|PUT|PATCH)['"]/);
  assert.match(source, /mutationAttempted:\s*false/);
  assert.match(source, /provider mutation remains separately founder-gated/);
  assert.match(source, /createHash\('sha256'\)/);
  assert.match(source, /bodySha256/);
  assert.match(source, /runtime:\s*summarizeRuntime\(runtime\)/);
  assert.doesNotMatch(source, /runtime:\s*runtime[,\n]/);
});

test('workflow runs provider inspection only after merge to main and retains its receipt', () => {
  const workflow = fs.readFileSync(
    new URL('../.github/workflows/reconcile-cloudflare-app-domain.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /Inspect live app-domain ownership \(read-only\)/);
  assert.match(workflow, /if:\s*github\.event_name == 'push'/);
  assert.match(workflow, /audit-cloudflare-app-domain-ownership\.mjs/);
  assert.match(workflow, /cloudflare-app-domain-ownership-inspection/);
  assert.match(workflow, /artifacts\/cloudflare-app-domain-ownership-inspection\.json/);
});
