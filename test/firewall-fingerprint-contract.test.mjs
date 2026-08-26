import assert from 'node:assert/strict';
import test from 'node:test';

import {buildFirewallFingerprint} from '../scripts/build-firewall-fingerprint.mjs';

const sha = '10513970fa974a6e28290c70e4bd8ffabbb37185';

function basePolicy() {
  return {
    version: '10',
    repository: 'jussray/Sekret-Bip',
    activationStage: 'policy-ci-only',
    claims: {
      productionProtectionStatus: 'not-verified',
      reason: 'live evidence required',
    },
    cloudflare: {
      primaryHosts: ['sekretbip.net', 'api.sekretbip.net'],
      activeWorker: 'sekret-backend',
      edgeControls: {
        managedWaf: {enforcementStatus: 'live-not-verified'},
        apiShield: {enforcementStatus: 'live-not-verified'},
        authenticatedOriginPulls: {enforcementStatus: 'live-not-verified'},
      },
    },
    controls: {
      rateLimiting: {liveBindingStatus: 'not-verified'},
      botDefense: {enforcementStatus: 'live-not-verified'},
      auth: {liveConfigurationStatus: 'not-verified'},
      cors: {liveEnforcementStatus: 'not-verified'},
      headers: {liveEnforcementStatus: 'not-verified'},
    },
  };
}

function passingOutcomes() {
  return {
    firewall_policy: 'success',
    release_transport: 'success',
    cloudflare_release: 'success',
    backend_health: 'success',
    supabase_schema: 'success',
    supabase_health: 'success',
    production_playwright: 'success',
  };
}

function releaseEvidence(commitSha = sha) {
  return {
    version: 5,
    commitSha,
    expectedSha: commitSha,
    complete: true,
    status: 'succeeded',
    pagesRelease: {commitSha, complete: true},
    workerRuntime: {releaseSha: commitSha, expectedSha: commitSha, complete: true, healthOk: true},
  };
}

test('current Firewall v10 truth remains UNVERIFIED instead of inheriting a provider green signal', () => {
  const fingerprint = buildFirewallFingerprint({
    policy: basePolicy(),
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    stepOutcomes: passingOutcomes(),
    releaseEvidence: releaseEvidence(),
    schemaEvidence: {status: 'verified', verified: true},
    attack20Evidence: null,
    generatedAt: '2026-08-26T08:00:00.000Z',
  });

  assert.equal(fingerprint.status, 'UNVERIFIED');
  assert.equal(fingerprint.nonAveraging, true);
  assert.equal(fingerprint.authority.supportiveProviders.vercel.authoritative, false);
  assert.equal(fingerprint.attack20.status, 'UNVERIFIED');
  assert.ok(fingerprint.blockers.includes('attack20_a01_a07_evidence_missing'));
  assert.ok(fingerprint.blockers.includes('edge_managedWaf_unverified'));
});

test('an explicit failed production witness makes the Firewall Fingerprint FAIL', () => {
  const outcomes = passingOutcomes();
  outcomes.backend_health = 'failure';

  const fingerprint = buildFirewallFingerprint({
    policy: basePolicy(),
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    stepOutcomes: outcomes,
    releaseEvidence: releaseEvidence(),
    schemaEvidence: {status: 'verified', verified: true},
    attack20Evidence: {networkIngressStatus: 'PASS'},
  });

  assert.equal(fingerprint.status, 'FAIL');
  assert.ok(fingerprint.blockers.includes('witness_backend_health_failure'));
});

test('release evidence bound to another SHA makes the Firewall Fingerprint FAIL', () => {
  const otherSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const fingerprint = buildFirewallFingerprint({
    policy: basePolicy(),
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    stepOutcomes: passingOutcomes(),
    releaseEvidence: releaseEvidence(otherSha),
    schemaEvidence: {status: 'verified', verified: true},
    attack20Evidence: {networkIngressStatus: 'PASS'},
  });

  assert.equal(fingerprint.status, 'FAIL');
  assert.ok(fingerprint.blockers.some((entry) => entry.startsWith('cloudflare_release_sha_mismatch:')));
});

test('PASS requires all live edge states, exact runtime evidence, schema proof, witnesses, and ATTACK-20 network evidence', () => {
  const policy = basePolicy();
  policy.claims.productionProtectionStatus = 'verified';
  policy.cloudflare.edgeControls.managedWaf.enforcementStatus = 'verified';
  policy.cloudflare.edgeControls.apiShield.enforcementStatus = 'verified';
  policy.cloudflare.edgeControls.authenticatedOriginPulls.enforcementStatus = 'verified';
  policy.controls.rateLimiting.liveBindingStatus = 'verified';
  policy.controls.botDefense.enforcementStatus = 'verified';
  policy.controls.auth.liveConfigurationStatus = 'verified';
  policy.controls.cors.liveEnforcementStatus = 'verified';
  policy.controls.headers.liveEnforcementStatus = 'verified';

  const fingerprint = buildFirewallFingerprint({
    policy,
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    stepOutcomes: passingOutcomes(),
    releaseEvidence: releaseEvidence(),
    schemaEvidence: {status: 'verified', verified: true},
    attack20Evidence: {networkIngressStatus: 'PASS'},
  });

  assert.equal(fingerprint.status, 'PASS');
  assert.deepEqual(fingerprint.blockers, []);
});

test('a Vercel-style provider-local signal is not an input capable of upgrading canonical Cloudflare authority', () => {
  const fingerprint = buildFirewallFingerprint({
    policy: basePolicy(),
    expectedSha: sha,
    repository: 'jussray/Sekret-Bip',
    stepOutcomes: passingOutcomes(),
    releaseEvidence: releaseEvidence(),
    schemaEvidence: {status: 'verified', verified: true},
    attack20Evidence: {networkIngressStatus: 'PASS'},
  });

  assert.equal(fingerprint.authority.supportiveProviders.vercel.state, 'provider-local-signal-only');
  assert.equal(fingerprint.status, 'UNVERIFIED');
});
