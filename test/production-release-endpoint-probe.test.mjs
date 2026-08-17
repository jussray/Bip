import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyEndpointProbe,
  collectProductionReleaseEndpointEvidence,
  probeJsonEndpoint,
} from '../scripts/probe-production-release-endpoints.mjs';

function mockHeaders(values = {}) {
  const normalized = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    get(name) {
      return normalized.get(String(name).toLowerCase()) ?? null;
    },
  };
}

function mockResponse({
  status = 200,
  url = 'https://app.sekretbip.net/.well-known/sekret-release.json',
  redirected = false,
  headers = {'content-type': 'application/json'},
  json = {commitSha: 'a'.repeat(40)},
  body = '',
} = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    url,
    redirected,
    headers: mockHeaders(headers),
    async json() {
      if (json instanceof Error) throw json;
      return json;
    },
    async text() {
      return body;
    },
  };
}

test('classifies redirects to a Cloudflare Access team domain', () => {
  assert.equal(
    classifyEndpointProbe({
      redirected: true,
      finalUrl: 'https://sekretbip.cloudflareaccess.com/cdn-cgi/access/login/app',
      status: 200,
      ok: true,
      jsonState: 'invalid',
    }),
    'cloudflare-access-intercepted',
  );
});

test('classifies a Cloudflare Access default forbidden page without treating every 403 as Access', async () => {
  const accessProbe = await probeJsonEndpoint('https://app.sekretbip.net/.well-known/sekret-release.json', {
    fetchImpl: async () =>
      mockResponse({
        status: 403,
        headers: {'content-type': 'text/html'},
        body: '<html><title>Cloudflare Access</title><body>That account does not have access</body></html>',
      }),
  });

  assert.equal(accessProbe.accessBlockPage, true);
  assert.equal(accessProbe.classification, 'cloudflare-access-intercepted');

  const genericForbidden = await probeJsonEndpoint('https://app.sekretbip.net/.well-known/sekret-release.json', {
    fetchImpl: async () =>
      mockResponse({
        status: 403,
        headers: {'content-type': 'text/html'},
        body: '<html><body>Forbidden</body></html>',
      }),
  });

  assert.equal(genericForbidden.accessBlockPage, false);
  assert.equal(genericForbidden.classification, 'http-error');
});

test('collects Access blocking only for positively identified surfaces', async () => {
  const fetchImpl = async (url) => {
    const target = String(url);
    if (target.includes('app.sekretbip.net')) {
      return mockResponse({
        status: 403,
        headers: {'content-type': 'text/html'},
        body: '<html><body>Cloudflare Access — That account does not have access</body></html>',
      });
    }
    return mockResponse({
      status: 200,
      url: 'https://api.sekretbip.net/health',
      json: {ok: true, releaseSha: 'b'.repeat(40)},
    });
  };

  const evidence = await collectProductionReleaseEndpointEvidence({
    expectedSha: 'b'.repeat(40),
    fetchImpl,
  });

  assert.equal(evidence.status, 'cloudflare-access-intercepted');
  assert.deepEqual(evidence.blockedByAccess, ['frontend']);
  assert.equal(evidence.frontend.classification, 'cloudflare-access-intercepted');
  assert.equal(evidence.backend.classification, 'ok');
});

test('keeps successful and malformed JSON classifications unchanged', async () => {
  const okProbe = await probeJsonEndpoint('https://api.sekretbip.net/health', {
    fetchImpl: async () =>
      mockResponse({
        url: 'https://api.sekretbip.net/health',
        json: {ok: true, releaseSha: 'c'.repeat(40)},
      }),
  });
  assert.equal(okProbe.classification, 'ok');
  assert.equal(okProbe.healthOk, true);

  const invalidProbe = await probeJsonEndpoint('https://api.sekretbip.net/health', {
    fetchImpl: async () =>
      mockResponse({
        url: 'https://api.sekretbip.net/health',
        json: new SyntaxError('invalid JSON'),
      }),
  });
  assert.equal(invalidProbe.classification, 'invalid-json');
});
