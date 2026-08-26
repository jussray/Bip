import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

import {
  buildReleaseObservationComment,
  validateFirewallFingerprint,
} from '../scripts/publish-production-release-observation.mjs';

const sha = '10513970fa974a6e28290c70e4bd8ffabbb37185';

function releaseEvidence() {
  return {
    version: 5,
    commitSha: sha,
    complete: true,
    status: 'succeeded',
    verifiedAt: '2026-08-26T08:00:00.000Z',
    pagesRelease: {
      commitSha: sha,
      complete: true,
      marker: {
        environment: 'production',
        branch: 'main',
        deploymentProvider: 'cloudflare',
        deploymentId: 'deployment-1',
      },
    },
    workerRuntime: {
      expectedSha: sha,
      releaseSha: sha,
      versionId: 'version-1',
      versionTag: sha,
      healthOk: true,
      complete: true,
    },
    requiredChecks: {
      frontend: {status: 'completed', conclusion: 'success'},
      backend: {status: 'completed', conclusion: 'success'},
    },
  };
}

function firewallFingerprint(status = 'UNVERIFIED') {
  return {
    kind: 'firewall-fingerprint',
    version: 1,
    expectedSha: sha,
    status,
    nonAveraging: true,
    policy: {productionProtectionStatus: 'not-verified'},
    attack20: {status: 'UNVERIFIED'},
    blockers: ['cloudflare_live_config_unverified'],
  };
}

test('release receipt retains Firewall Fingerprint separately without converting UNVERIFIED into release failure', () => {
  const comment = buildReleaseObservationComment({
    evidence: releaseEvidence(),
    firewallFingerprint: firewallFingerprint(),
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    runId: '123',
  });

  assert.match(comment, /VERIFIED: exact production release observed/u);
  assert.match(comment, /### Firewall Fingerprint/u);
  assert.match(comment, /Status: `UNVERIFIED`/u);
  assert.match(comment, /cannot be averaged into a security or launch-green claim/u);
});

test('release receipt can expose a FAIL Firewall Fingerprint while keeping release proof semantically separate', () => {
  const comment = buildReleaseObservationComment({
    evidence: releaseEvidence(),
    firewallFingerprint: firewallFingerprint('FAIL'),
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    runId: '123',
  });

  assert.match(comment, /Status: `FAIL`/u);
  assert.match(comment, /VERIFIED: exact production release observed/u);
});

test('Firewall Fingerprint must be exact-SHA bound', () => {
  const fingerprint = firewallFingerprint();
  fingerprint.expectedSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  assert.throws(
    () => validateFirewallFingerprint(fingerprint, sha),
    /Firewall Fingerprint SHA mismatch/u,
  );
});

test('Firewall Fingerprint must preserve non-averaging semantics', () => {
  const fingerprint = firewallFingerprint();
  fingerprint.nonAveraging = false;

  assert.throws(
    () => validateFirewallFingerprint(fingerprint, sha),
    /non-averaging invariant/u,
  );
});


const workflow = readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

function stepBlock(name) {
  const marker = `- name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `missing production workflow step: ${name}`);
  const next = workflow.indexOf('\n      - name:', start + marker.length);
  return workflow.slice(start, next === -1 ? workflow.length : next);
}

test('existing production workflow retains the separate Firewall Fingerprint after Playwright', () => {
  for (const required of [
    'FIREWALL_FINGERPRINT_PATH: artifacts/firewall-fingerprint.json',
    'ATTACK20_EVIDENCE_PATH: artifacts/attack20-network-ingress.json',
    'run: node scripts/verify-firewall-v10.mjs',
    'run: node scripts/build-firewall-fingerprint.mjs',
    'artifacts/firewall-fingerprint.json',
    '"firewall_policy":"${{ steps.firewall_policy.outcome }}"',
    '"cloudflare_release":"${{ steps.cloudflare_release.outcome }}"',
    '"production_playwright":"${{ steps.production_playwright.outcome }}"',
    '"firewall_fingerprint":"${{ steps.firewall_fingerprint.outcome }}"',
  ]) {
    assert.ok(workflow.includes(required), `missing Firewall Fingerprint workflow contract: ${required}`);
  }

  const policy = stepBlock('Verify Firewall v10 repository contract');
  const fingerprint = stepBlock('Build separate Firewall Fingerprint');
  const independent = /if: \$\{\{ !cancelled\(\) && steps\.trusted_current_main\.outcome == 'success' \}\}/u;

  assert.match(policy, independent);
  assert.match(fingerprint, independent);
  assert.match(policy, /timeout-minutes: 5/u);
  assert.match(fingerprint, /timeout-minutes: 5/u);
  assert.ok(
    workflow.indexOf('- name: Build separate Firewall Fingerprint')
      > workflow.indexOf('- name: Verify exact deployed frontend with Playwright'),
    'fingerprint must be built after production Playwright has an outcome',
  );
});

test('existing 180-minute job retains at least twenty minutes of headroom after the two new bounded steps', () => {
  const originalBoundedMinutes = 147;
  const addedFingerprintMinutes = 10;
  assert.match(workflow, /verify-native-deployment:[\s\S]*?timeout-minutes: 180/u);
  assert.ok(180 - originalBoundedMinutes - addedFingerprintMinutes >= 20);
});
