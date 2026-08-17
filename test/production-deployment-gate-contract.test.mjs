import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildCloudflareAccessBlockerEvidence,
  classifyEndpointProbe,
  collectProductionReleaseEndpointEvidence,
  probeJsonEndpoint,
} from '../scripts/probe-production-release-endpoints.mjs';

const workflow = readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');
const productionSmokeWorkflow = readFileSync('.github/workflows/production-smoke.yml', 'utf8');
const productionConfig = readFileSync('playwright.production.config.ts', 'utf8');
const productionSmoke = readFileSync('e2e/production-smoke.spec.ts', 'utf8');
const productionJourneys = readFileSync('e2e/production-audience-journeys.spec.ts', 'utf8');
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

test('production smoke proves one explicit deployed main SHA and retains its evidence', () => {
  assert.match(productionSmokeWorkflow, /expected_release_sha:/);
  assert.match(productionSmokeWorkflow, /EXPECTED_RELEASE_SHA:/);
  assert.match(productionSmokeWorkflow, /ref: \$\{\{ env\.EXPECTED_RELEASE_SHA \}\}/);
  assert.match(productionSmokeWorkflow, /git merge-base --is-ancestor "\$EXPECTED_RELEASE_SHA" origin\/main/);
  assert.match(productionSmokeWorkflow, /production-smoke-\$\{\{ env\.EXPECTED_RELEASE_SHA \}\}/);
  assert.match(productionSmokeWorkflow, /if: always\(\)/);
});

test('production Playwright includes read-only Teen, Bip Jr, and Parent audience journeys', () => {
  assert.match(productionConfig, /production-audience-journeys\.spec\.ts/);
  assert.match(productionJourneys, /production Teen journey reaches age-gated onboarding without a write/);
  assert.match(productionJourneys, /production Bip Jr journey hands off to the parent-controlled entry without a write/);
  assert.match(productionJourneys, /production Parent journey reaches sign-in and keeps approvals protected/);
  assert.doesNotMatch(productionJourneys, /\.fill\(|\.type\(|pressSequentially|request\.post|fetch\(/);
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
  assert.match(releaseProbe, /CLOUDFLARE_ACCESS_INTERCEPTED/);
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
  assert.equal(evidence.classification, 'http-error');
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
  assert.equal(evidence.classification, 'ok');
  assert.equal('privateValue' in evidence, false);
});

test('Cloudflare Access redirects are classified as release blockers with redacted authority', async () => {
  const evidence = await probeJsonEndpoint('https://app.sekretbip.net/.well-known/sekret-release.json', {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      url: 'https://mcgill-raylene.cloudflareaccess.com/cdn-cgi/access/login/app.sekretbip.net',
      redirected: true,
      headers: {get: () => 'text/html'},
      json: async () => {
        throw new SyntaxError('not json');
      },
    }),
  });

  assert.equal(evidence.classification, 'cloudflare-access-intercepted');
  assert.equal(classifyEndpointProbe(evidence), 'cloudflare-access-intercepted');
  assert.equal(evidence.finalUrl, 'https://cloudflareaccess.com/cdn-cgi/access/login/app.sekretbip.net');
});

test('production evidence identifies every surface intercepted by Cloudflare Access', async () => {
  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    url: `https://mcgill-raylene.cloudflareaccess.com/cdn-cgi/access/login/${new URL(url).hostname}`,
    redirected: true,
    headers: {get: () => 'text/html'},
    json: async () => {
      throw new SyntaxError('not json');
    },
  });

  const evidence = await collectProductionReleaseEndpointEvidence({
    expectedSha: '8c7ae915bc5a85739c23022316b8e5c19da640d0',
    fetchImpl,
  });

  assert.equal(evidence.version, 3);
  assert.equal(evidence.status, 'cloudflare-access-intercepted');
  assert.deepEqual(evidence.blockedByAccess, ['frontend', 'backend']);
});

test('Access interception is promoted into the retained v5 blocker receipt evidence', () => {
  const expectedSha = '388cd65958cc6d80d9f0ef791a31b9737d325e89';
  const blocker = buildCloudflareAccessBlockerEvidence({
    expectedSha,
    status: 'cloudflare-access-intercepted',
    blockedByAccess: ['frontend', 'backend'],
    frontend: {classification: 'cloudflare-access-intercepted'},
    backend: {classification: 'cloudflare-access-intercepted'},
  });

  assert.equal(blocker.version, 5);
  assert.equal(blocker.commitSha, expectedSha);
  assert.equal(blocker.status, 'failed');
  assert.equal(blocker.complete, false);
  assert.equal(blocker.readinessState, 'cloudflare-access-intercepted');
  assert.equal(blocker.observerError, null);
  assert.deepEqual(blocker.transportBlocker.blockedSurfaces, ['frontend', 'backend']);
  assert.equal(blocker.transportBlocker.frontendClassification, 'cloudflare-access-intercepted');
  assert.equal(blocker.transportBlocker.backendClassification, 'cloudflare-access-intercepted');
  assert.deepEqual(blocker.checkSummary, {missing: [], pending: [], failed: [], unsuccessful: []});
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
