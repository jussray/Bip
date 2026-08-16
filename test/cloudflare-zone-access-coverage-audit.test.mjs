import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { auditCloudflareZoneAccessCoverage } from '../scripts/audit-cloudflare-zone-access-coverage.mjs';

const ACCOUNT_ID = '0123456789abcdef0123456789abcdef';
const ZONE_ID = 'fedcba9876543210fedcba9876543210';

function response(result, { ok = true, status = 200, statusText = 'OK', errors = [] } = {}) {
  return {
    ok,
    status,
    statusText,
    async json() {
      return ok
        ? { success: true, result }
        : { success: false, errors };
    },
  };
}

test('falls back across token candidates and retains only matching zone-scoped Access coverage', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-zone-access-audit-'));
  const evidencePath = path.join(dir, 'evidence.json');
  const staleToken = 'stale-token-must-not-appear';
  const activeToken = 'active-token-must-not-appear';
  const privateEmail = 'private@example.com';

  const fetchImpl = async (url, options = {}) => {
    const token = String(options.headers?.Authorization || '').replace(/^Bearer /, '');

    if (url.includes('/zones?name=sekretbip.net')) {
      if (token === staleToken) {
        return response(null, {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          errors: [{ code: 10000, message: 'Authentication error' }],
        });
      }
      assert.equal(token, activeToken);
      return response([
        { id: ZONE_ID, name: 'sekretbip.net', account: { id: ACCOUNT_ID } },
      ]);
    }

    if (url.endsWith(`/zones/${ZONE_ID}/access/apps?per_page=1000`)) {
      assert.equal(token, activeToken);
      return response([
        {
          id: 'wildcard-app',
          name: 'Legacy Se’kret Access',
          type: 'self_hosted',
          domain: '*.sekretbip.net',
        },
        {
          id: 'app-exact',
          name: 'Se’kret App Exact',
          type: 'self_hosted',
          domain: 'app.sekretbip.net',
        },
        {
          id: 'unrelated-private',
          name: 'Private Admin',
          type: 'self_hosted',
          domain: 'private.sekretbip.net',
        },
      ]);
    }

    if (url.includes(`/zones/${ZONE_ID}/access/apps/wildcard-app/policies`)) {
      return response([
        {
          id: 'policy-wildcard',
          name: `Login for ${privateEmail}`,
          decision: 'allow',
          precedence: 1,
          include: [{ email: { email: privateEmail } }],
          require: [],
          exclude: [],
        },
      ]);
    }

    if (url.includes(`/zones/${ZONE_ID}/access/apps/app-exact/policies`)) {
      return response([
        {
          id: 'policy-app',
          name: 'App Team',
          decision: 'allow',
          precedence: 2,
          include: [{ email_domain: { domain: 'example.com' } }],
          require: [],
          exclude: [],
        },
      ]);
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const receipt = await auditCloudflareZoneAccessCoverage({
    env: {
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
      CLOUDFLARE_ACCESS_API_TOKEN: staleToken,
      CLOUDFLARE_API_TOKEN: activeToken,
      CLOUDFLARE_ZONE_ACCESS_EVIDENCE_PATH: evidencePath,
    },
    fetchImpl,
    now: () => new Date('2026-08-16T08:45:00.000Z'),
  });

  assert.equal(receipt.status, 'audited');
  assert.equal(receipt.mutationPerformed, false);
  assert.equal(receipt.zoneResolved, true);
  assert.equal(receipt.applicationCountObserved, 3);
  assert.equal(receipt.credential.selectedSource, 'CLOUDFLARE_API_TOKEN');
  assert.equal(receipt.credential.failures[0].status, 403);
  assert.deepEqual(receipt.credential.failures[0].providerCodes, [10000]);

  const appCoverage = receipt.coverage.find((item) => item.hostname === 'app.sekretbip.net');
  const apiCoverage = receipt.coverage.find((item) => item.hostname === 'api.sekretbip.net');
  assert.deepEqual(
    appCoverage.matchingApplications.map((app) => app.name).sort(),
    ['Legacy Se’kret Access', 'Se’kret App Exact'].sort(),
  );
  assert.deepEqual(
    apiCoverage.matchingApplications.map((app) => app.name),
    ['Legacy Se’kret Access'],
  );
  assert.deepEqual(
    appCoverage.matchingApplications.find((app) => app.id === 'wildcard-app').policies[0].includeSelectors,
    ['email'],
  );

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.doesNotMatch(retained, new RegExp(staleToken));
  assert.doesNotMatch(retained, new RegExp(activeToken));
  assert.doesNotMatch(retained, new RegExp(privateEmail));
  assert.doesNotMatch(retained, /example\.com/);
  assert.doesNotMatch(retained, /Private Admin/);
  assert.doesNotMatch(retained, new RegExp(ZONE_ID));
  assert.doesNotMatch(retained, /Login for private@example\.com/);
});

test('fails closed when the resolved zone belongs to another account', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-zone-access-account-mismatch-'));
  const evidencePath = path.join(dir, 'evidence.json');
  let accessAppCalls = 0;

  await assert.rejects(
    () => auditCloudflareZoneAccessCoverage({
      env: {
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN: 'configured-token',
        CLOUDFLARE_ZONE_ACCESS_EVIDENCE_PATH: evidencePath,
      },
      fetchImpl: async (url) => {
        if (url.includes('/zones?name=sekretbip.net')) {
          return response([
            { id: ZONE_ID, name: 'sekretbip.net', account: { id: 'different-account' } },
          ]);
        }
        accessAppCalls += 1;
        throw new Error(`Unexpected request: ${url}`);
      },
    }),
    /No configured Cloudflare token could resolve the target zone and list its Access applications/,
  );

  assert.equal(accessAppCalls, 0);
  const receipt = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.equal(receipt.status, 'zone-access-read-failed');
  assert.equal(receipt.zoneResolved, false);
  assert.equal(receipt.applicationCountObserved, null);
  assert.equal(receipt.credential.failures.length, 1);
});

test('writes a fail-closed receipt when Cloudflare credentials are missing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-zone-access-config-'));
  const evidencePath = path.join(dir, 'evidence.json');

  await assert.rejects(
    () => auditCloudflareZoneAccessCoverage({
      env: { CLOUDFLARE_ZONE_ACCESS_EVIDENCE_PATH: evidencePath },
      fetchImpl: async () => {
        throw new Error('provider must not be called');
      },
    }),
    /CLOUDFLARE_ACCOUNT_ID is required/,
  );

  const receipt = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  assert.equal(receipt.status, 'configuration-missing');
  assert.equal(receipt.mutationPerformed, false);
  assert.equal(receipt.accountIdConfigured, false);
});
