import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { auditCloudflareAccessCoverage } from '../scripts/audit-cloudflare-access-coverage.mjs';

const ACCOUNT_ID = '0123456789abcdef0123456789abcdef';

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

test('falls back across token candidates and retains only redacted matching Access coverage', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-access-audit-'));
  const evidencePath = path.join(dir, 'evidence.json');
  const staleToken = 'stale-token-must-not-appear';
  const activeToken = 'active-token-must-not-appear';
  const secretEmail = 'private@example.com';
  const authorizationSeen = [];

  const fetchImpl = async (url, options = {}) => {
    const token = String(options.headers?.Authorization || '').replace(/^Bearer /, '');
    authorizationSeen.push(token);

    if (url.endsWith('/access/apps?per_page=1000')) {
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
        {
          id: 'all-workers-app',
          name: 'All Workers',
          type: 'self_hosted',
          destinations: [{ type: 'all_workers' }],
        },
        {
          id: 'app-host',
          name: 'Se’kret App',
          type: 'self_hosted',
          domain: 'app.sekretbip.net',
          destinations: [{ type: 'public', uri: 'https://app.sekretbip.net' }],
        },
        {
          id: 'unrelated',
          name: 'Unrelated Private App',
          type: 'self_hosted',
          domain: 'private.example.com',
        },
      ]);
    }

    if (url.includes('/access/apps/all-workers-app/policies')) {
      return response([
        {
          id: 'policy-all',
          name: 'Require login',
          decision: 'allow',
          precedence: 1,
          include: [{ email: { email: secretEmail } }],
          require: [],
          exclude: [],
        },
      ]);
    }

    if (url.includes('/access/apps/app-host/policies')) {
      return response([
        {
          id: 'policy-app',
          name: 'Allow team',
          decision: 'allow',
          precedence: 1,
          include: [{ email_domain: { domain: 'example.com' } }],
          require: [],
          exclude: [],
        },
      ]);
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const receipt = await auditCloudflareAccessCoverage({
    env: {
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
      CLOUDFLARE_ACCESS_API_TOKEN: staleToken,
      CLOUDFLARE_API_TOKEN: activeToken,
      CLOUDFLARE_ACCESS_EVIDENCE_PATH: evidencePath,
    },
    fetchImpl,
    now: () => new Date('2026-08-16T08:20:00.000Z'),
  });

  assert.equal(receipt.status, 'audited');
  assert.equal(receipt.mutationPerformed, false);
  assert.equal(receipt.credential.selectedSource, 'CLOUDFLARE_API_TOKEN');
  assert.equal(receipt.credential.failures[0].status, 403);
  assert.deepEqual(receipt.credential.failures[0].providerCodes, [10000]);

  const appCoverage = receipt.coverage.find((item) => item.hostname === 'app.sekretbip.net');
  const apiCoverage = receipt.coverage.find((item) => item.hostname === 'api.sekretbip.net');
  assert.deepEqual(
    appCoverage.matchingApplications.map((app) => app.name).sort(),
    ['All Workers', 'Se’kret App'].sort(),
  );
  assert.deepEqual(apiCoverage.matchingApplications.map((app) => app.name), ['All Workers']);
  assert.deepEqual(appCoverage.matchingApplications[0].policies[0].includeSelectors, ['email']);

  const retained = fs.readFileSync(evidencePath, 'utf8');
  assert.doesNotMatch(retained, new RegExp(staleToken));
  assert.doesNotMatch(retained, new RegExp(activeToken));
  assert.doesNotMatch(retained, new RegExp(secretEmail));
  assert.doesNotMatch(retained, /Unrelated Private App/);
  assert.ok(authorizationSeen.includes(staleToken));
  assert.ok(authorizationSeen.includes(activeToken));
});

test('writes a fail-closed receipt when Cloudflare credentials are missing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-access-audit-config-'));
  const evidencePath = path.join(dir, 'evidence.json');

  await assert.rejects(
    () => auditCloudflareAccessCoverage({
      env: { CLOUDFLARE_ACCESS_EVIDENCE_PATH: evidencePath },
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
