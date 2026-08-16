import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {probeJsonEndpoint} from '../scripts/probe-production-release-endpoints.mjs';

const workflow = readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');
const productionConfig = readFileSync('playwright.production.config.ts', 'utf8');
const productionSmoke = readFileSync('e2e/production-smoke.spec.ts', 'utf8');
const releaseProbe = readFileSync('scripts/probe-production-release-endpoints.mjs', 'utf8');

test('production verification runs after relevant main pushes', () => {
  assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /EXPECTED_RELEASE_SHA: \$\{\{ inputs\.target_sha \|\| github\.sha \}\}/);
  assert.match(workflow, /verify-cloudflare-native-deploy\.mjs/);
  assert.match(workflow, /test:e2e:production/);
});

test('production release proof targets the application frontend and preserves backend authority', () => {
  assert.match(workflow, /PRODUCTION_BASE_URL: https:\/\/app\.sekretbip\.net/);
  assert.match(workflow, /FRONTEND_RELEASE_URL: https:\/\/app\.sekretbip\.net\/\.well-known\/sekret-release\.json/);
  assert.match(workflow, /BACKEND_HEALTH_URL: https:\/\/api\.sekretbip\.net\/health/);
  assert.doesNotMatch(workflow, /FRONTEND_RELEASE_URL: https:\/\/sekretbip\.net\//);
  assert.match(productionConfig, /https:\/\/app\.sekretbip\.net/);
});

test('production release transport evidence is retained without response bodies', () => {
  assert.match(workflow, /node scripts\/probe-production-release-endpoints\.mjs/);
  assert.match(workflow, /artifacts\/production-release-endpoint-probe\.json/);
  assert.match(releaseProbe, /status: response\.status/);
  assert.match(releaseProbe, /contentType/);
  assert.match(releaseProbe, /finalUrl/);
  assert.match(releaseProbe, /redirected: response\.redirected/);
  assert.match(releaseProbe, /jsonState/);
  assert.match(releaseProbe, /releaseSha/);
  assert.doesNotMatch(releaseProbe, /responseBody|bodyText|response\.text\(/);
  assert.doesNotMatch(releaseProbe, /set-cookie|authorization/i);
});

test('release transport probe classifies non-OK responses without reading their bodies', async () => {
  let jsonCalled = false;
  const evidence = await probeJsonEndpoint('https://api.sekretbip.net/health', {
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      url: 'https://api.sekretbip.net/health',
      redirected: false,
      headers: {get: (name) => name === 'content-type' ? 'text/html' : null},
      json: async () => {
        jsonCalled = true;
        return {};
      },
    }),
  });

  assert.equal(jsonCalled, false);
  assert.equal(evidence.status, 403);
  assert.equal(evidence.contentType, 'text/html');
  assert.equal(evidence.jsonState, 'skipped-non-ok');
  assert.equal(evidence.releaseSha, null);
});

test('release transport probe retains only public identity fields from JSON', async () => {
  const evidence = await probeJsonEndpoint('https://api.sekretbip.net/health', {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      url: 'https://api.sekretbip.net/health',
      redirected: false,
      headers: {get: () => 'application/json'},
      json: async () => ({
        ok: true,
        releaseSha: '45800cacabc531968d7dcaaa5ec505a66ef68ad1',
        privateValue: 'must-not-be-retained',
      }),
    }),
  });

  assert.equal(evidence.status, 200);
  assert.equal(evidence.jsonState, 'ok');
  assert.equal(evidence.healthOk, true);
  assert.equal(evidence.releaseSha, '45800cacabc531968d7dcaaa5ec505a66ef68ad1');
  assert.equal('privateValue' in evidence, false);
});

test('production Playwright verifies both public variants and their Enter paths', () => {
  assert.match(productionConfig, /testMatch/);
  assert.match(productionSmoke, /web-welcome-hero-teen/);
  assert.match(productionSmoke, /web-welcome-hero-bip-jr/);
  assert.match(productionSmoke, /YOUR PEOPLE\. YOUR PEACE\./);
  assert.match(productionSmoke, /YOUR FAMILY\. YOUR SPACE\./);
  assert.match(productionSmoke, /How old are you\?/);
  assert.match(productionSmoke, /enter your parent space/);
  assert.match(productionSmoke, /web-welcome-suhana/);
  assert.match(productionSmoke, /toHaveCount\(0\)/);
  assert.doesNotMatch(productionSmoke, /toHaveText\('Suhana'\)/);
});
