import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  appHasExactPublicDestination,
  configFromEnv,
  isCloudflareAccessUrl,
  isEveryoneBypassPolicy,
  publicDestinationTargetsHost,
  selectBlockingApplication,
} from '../scripts/reconcile-cloudflare-public-apex-access.mjs';

const workflowSource = readFileSync(
  new URL('../.github/workflows/reconcile-cloudflare-public-apex-access.yml', import.meta.url),
  'utf8',
);
const reconcilerSource = readFileSync(
  new URL('../scripts/reconcile-cloudflare-public-apex-access.mjs', import.meta.url),
  'utf8',
);

test('defaults target only the public apex', () => {
  const config = configFromEnv({});
  assert.equal(config.targetHostname, 'sekretbip.net');
  assert.equal(config.targetUrl, 'https://sekretbip.net/');
  assert.equal(config.applicationName, 'sekretbip.net - public apex bypass');
});

test('public destination matching is exact-host scoped', () => {
  assert.equal(
    publicDestinationTargetsHost({ type: 'public', uri: 'sekretbip.net/*' }, 'sekretbip.net'),
    true,
  );
  assert.equal(
    publicDestinationTargetsHost({ type: 'public', uri: 'sekretbip.net/welcome/*' }, 'sekretbip.net'),
    true,
  );
  assert.equal(
    publicDestinationTargetsHost({ type: 'public', uri: 'app.sekretbip.net/*' }, 'sekretbip.net'),
    false,
  );
  assert.equal(
    publicDestinationTargetsHost({ type: 'all_workers' }, 'sekretbip.net'),
    false,
  );
});

test('application public destination check does not treat worker scope as apex ownership', () => {
  assert.equal(
    appHasExactPublicDestination(
      { destinations: [{ type: 'all_workers' }, { type: 'worker', worker_id: 'sekret-backend' }] },
      'sekretbip.net',
    ),
    false,
  );
  assert.equal(
    appHasExactPublicDestination(
      { destinations: [{ type: 'public', uri: 'sekretbip.net/*' }] },
      'sekretbip.net',
    ),
    true,
  );
});

test('Cloudflare Access URLs are detected by host or Access path', () => {
  assert.equal(
    isCloudflareAccessUrl('https://jussray.cloudflareaccess.com/cdn-cgi/access/login/sekretbip.net'),
    true,
  );
  assert.equal(isCloudflareAccessUrl('https://sekretbip.net/cdn-cgi/access/login'), true);
  assert.equal(isCloudflareAccessUrl('https://sekretbip.net/'), false);
});

test('bypass policy must explicitly include Everyone', () => {
  assert.equal(
    isEveryoneBypassPolicy({ decision: 'bypass', include: [{ everyone: {} }] }),
    true,
  );
  assert.equal(
    isEveryoneBypassPolicy({ decision: 'allow', include: [{ everyone: {} }] }),
    false,
  );
  assert.equal(
    isEveryoneBypassPolicy({ decision: 'bypass', include: [{ email: { email: 'owner@example.com' } }] }),
    false,
  );
});

test('blocking Access audience must resolve to at most one application', () => {
  const apps = [
    { id: 'a', aud: 'aud-a' },
    { id: 'b', aud: 'aud-b' },
  ];
  assert.equal(selectBlockingApplication(apps, 'aud-b')?.id, 'b');
  assert.equal(selectBlockingApplication(apps, 'missing'), null);
  assert.equal(selectBlockingApplication(apps, ''), null);
  assert.throws(
    () => selectBlockingApplication([{ id: 'a', aud: 'same' }, { id: 'b', aud: 'same' }], 'same'),
    /BLOCKING_AUD_NOT_UNIQUE/,
  );
});

test('provider mutation is founder-gated behind the protected Production environment', () => {
  assert.match(workflowSource, /environment:\s*Production/);
  assert.match(workflowSource, /test "\$GITHUB_ACTOR" = "jussray"/);
  assert.match(workflowSource, /test "\$GITHUB_REF" = "refs\/heads\/main"/);
  assert.match(workflowSource, /EXPECTED_MAIN_SHA:\s*\$\{\{ inputs\.expected_main_sha \}\}/);
  assert.match(workflowSource, /FIX_SEKRET_BIP_PUBLIC_APEX_ACCESS/);
  assert.match(workflowSource, /test "\$EXPECTED_MAIN_SHA" = "\$GITHUB_SHA"/);
});

test('a run-created bypass stays rollback-capable through browser proof', () => {
  assert.match(workflowSource, /if: failure\(\) && steps\.reconcile\.outcome == 'success'/);
  assert.match(workflowSource, /--rollback-created/);
  assert.match(reconcilerSource, /ROLLBACK_EVIDENCE_SCOPE_MISMATCH/);
  assert.match(reconcilerSource, /ROLLBACK_MANAGED_APP_DESTINATION_MISMATCH/);
  assert.match(reconcilerSource, /rolled-back-after-proof-failure/);
});

test('provider/account identifiers are not echoed in clear-text request failures', () => {
  assert.doesNotMatch(reconcilerSource, /Cloudflare \$\{options\.method/);
  assert.doesNotMatch(reconcilerSource, /final_url=/);
  assert.match(reconcilerSource, /Cloudflare provider request failed with status/);
});
