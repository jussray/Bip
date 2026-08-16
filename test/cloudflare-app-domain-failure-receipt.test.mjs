import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { classifyObservedRequest } from '../scripts/run-cloudflare-app-domain-reconcile-with-receipt.mjs';

test('sanitized request classification identifies Cloudflare preflight operations without URLs or secrets', () => {
  assert.deepEqual(
    classifyObservedRequest(
      'https://api.cloudflare.com/client/v4/accounts/account-1/pages/projects/sekret-bip/domains',
    ),
    { provider: 'cloudflare', operation: 'pages-domains-read', method: 'GET' },
  );
  assert.deepEqual(
    classifyObservedRequest(
      'https://api.cloudflare.com/client/v4/accounts/account-1/workers/domains?hostname=app.sekretbip.net',
    ),
    { provider: 'cloudflare', operation: 'worker-domains-read', method: 'GET' },
  );
  assert.deepEqual(
    classifyObservedRequest(
      'https://api.cloudflare.com/client/v4/zones/zone-1/workers/routes',
    ),
    { provider: 'cloudflare', operation: 'worker-routes-read', method: 'GET' },
  );
  assert.deepEqual(
    classifyObservedRequest('https://app.sekretbip.net/'),
    { provider: 'runtime', operation: 'app-runtime-probe', method: 'GET' },
  );
  assert.deepEqual(
    classifyObservedRequest('https://api.sekretbip.net/health'),
    { provider: 'runtime', operation: 'backend-health-probe', method: 'GET' },
  );
});

test('failure wrapper persists a safe receipt and never serializes caught exception text', () => {
  const wrapper = fs.readFileSync(
    new URL('../scripts/run-cloudflare-app-domain-reconcile-with-receipt.mjs', import.meta.url),
    'utf8',
  );

  assert.match(wrapper, /preflight-failed-before-mutation/);
  assert.match(wrapper, /mutationState/);
  assert.match(wrapper, /providerCodes/);
  assert.match(wrapper, /FAILURE_EVIDENCE_WRITTEN/);
  assert.doesNotMatch(wrapper, /error\.message|String\(error\)|payload\?\.errors[^\n]*message/);
});

test('workflow uses the receipt wrapper and fails if evidence is missing', () => {
  const workflow = fs.readFileSync(
    new URL('../.github/workflows/reconcile-cloudflare-app-domain.yml', import.meta.url),
    'utf8',
  );

  assert.match(
    workflow,
    /node scripts\/run-cloudflare-app-domain-reconcile-with-receipt\.mjs --apply/,
  );
  assert.match(workflow, /cloudflare-app-domain-failure-receipt\.test\.mjs/);
  assert.match(workflow, /if-no-files-found: error/);
});
