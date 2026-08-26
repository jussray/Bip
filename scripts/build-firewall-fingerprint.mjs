import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const VALID_STATUSES = new Set(['PASS', 'FAIL', 'UNVERIFIED']);

function normalizeSha(value) {
  return String(value ?? '').trim().toLowerCase();
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function readJsonOptional(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {
      __invalid: true,
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseOutcomes(value) {
  if (!value) return {};
  try {
    return objectOrEmpty(JSON.parse(value));
  } catch {
    return {parse_error: 'invalid FIREWALL_STEP_OUTCOMES JSON'};
  }
}

function classifyDeclaredState(value) {
  const state = String(value ?? '').trim().toLowerCase();
  if (!state) return 'UNVERIFIED';
  if (
    state.includes('fail')
    || state.includes('mismatch')
    || state.includes('blocked')
    || state.includes('invalid')
  ) return 'FAIL';
  if (
    state === 'verified'
    || state === 'live-verified'
    || state === 'enforced'
    || state === 'active-verified'
  ) return 'PASS';
  return 'UNVERIFIED';
}

function normalizeAttackStatus(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  return VALID_STATUSES.has(normalized) ? normalized : 'UNVERIFIED';
}

function releaseShaFromEvidence(evidence) {
  if (!evidence || evidence.__invalid) return '';
  return normalizeSha(
    evidence.commitSha
    || evidence.expectedSha
    || evidence.workerRuntime?.releaseSha
    || evidence.pagesRelease?.commitSha,
  );
}

export function buildFirewallFingerprint({
  policy,
  expectedSha,
  repository,
  stepOutcomes = {},
  releaseEvidence = null,
  schemaEvidence = null,
  attack20Evidence = null,
  generatedAt = new Date().toISOString(),
}) {
  const normalizedExpected = normalizeSha(expectedSha);
  if (!/^[0-9a-f]{40}$/.test(normalizedExpected)) {
    throw new Error('Firewall Fingerprint requires an exact 40-character release SHA.');
  }

  const policyObject = objectOrEmpty(policy);
  if (String(policyObject.version ?? '') !== '10') {
    throw new Error('Firewall Fingerprint requires Firewall v10 policy.');
  }

  const blockers = [];
  let explicitFailure = false;

  const policyRepository = String(policyObject.repository ?? '').trim();
  if (!repository || policyRepository !== repository) {
    explicitFailure = true;
    blockers.push(`policy_repository_mismatch:${policyRepository || 'missing'}`);
  }

  const outcomes = objectOrEmpty(stepOutcomes);
  if (outcomes.parse_error) {
    explicitFailure = true;
    blockers.push('invalid_step_outcomes');
  }

  const requiredWitnesses = [
    'firewall_policy',
    'release_transport',
    'cloudflare_release',
    'backend_health',
    'supabase_schema',
    'supabase_health',
    'production_playwright',
  ];

  const witnessState = {};
  for (const witness of requiredWitnesses) {
    const outcome = String(outcomes[witness] ?? 'not-observed').trim().toLowerCase();
    witnessState[witness] = outcome;
    if (outcome === 'failure' || outcome === 'cancelled') {
      explicitFailure = true;
      blockers.push(`witness_${witness}_${outcome}`);
    } else if (outcome !== 'success') {
      blockers.push(`witness_${witness}_${outcome || 'not-observed'}`);
    }
  }

  const releaseEvidenceState = (() => {
    if (!releaseEvidence) {
      blockers.push('cloudflare_release_evidence_missing');
      return 'UNVERIFIED';
    }
    if (releaseEvidence.__invalid) {
      explicitFailure = true;
      blockers.push('cloudflare_release_evidence_invalid');
      return 'FAIL';
    }
    const observedSha = releaseShaFromEvidence(releaseEvidence);
    if (observedSha && observedSha !== normalizedExpected) {
      explicitFailure = true;
      blockers.push(`cloudflare_release_sha_mismatch:${observedSha}`);
      return 'FAIL';
    }
    if (!observedSha) {
      blockers.push('cloudflare_release_sha_missing');
      return 'UNVERIFIED';
    }
    return 'PASS';
  })();

  const schemaState = (() => {
    if (!schemaEvidence) {
      blockers.push('supabase_schema_evidence_missing');
      return 'UNVERIFIED';
    }
    if (schemaEvidence.__invalid) {
      explicitFailure = true;
      blockers.push('supabase_schema_evidence_invalid');
      return 'FAIL';
    }
    if (schemaEvidence.verified === true || schemaEvidence.status === 'verified') return 'PASS';
    if (
      schemaEvidence.verified === false
      && ['failed', 'mismatch', 'invalid'].includes(String(schemaEvidence.status ?? '').toLowerCase())
    ) {
      explicitFailure = true;
      blockers.push(`supabase_schema_${schemaEvidence.status}`);
      return 'FAIL';
    }
    blockers.push(`supabase_schema_${String(schemaEvidence.status ?? 'unverified')}`);
    return 'UNVERIFIED';
  })();

  const edgeStates = {
    productionProtection: classifyDeclaredState(policyObject.claims?.productionProtectionStatus),
    managedWaf: classifyDeclaredState(policyObject.cloudflare?.edgeControls?.managedWaf?.enforcementStatus),
    apiShield: classifyDeclaredState(policyObject.cloudflare?.edgeControls?.apiShield?.enforcementStatus),
    authenticatedOriginPulls: classifyDeclaredState(
      policyObject.cloudflare?.edgeControls?.authenticatedOriginPulls?.enforcementStatus,
    ),
    rateLimitBinding: classifyDeclaredState(policyObject.controls?.rateLimiting?.liveBindingStatus),
    botDefense: classifyDeclaredState(policyObject.controls?.botDefense?.enforcementStatus),
    authConfiguration: classifyDeclaredState(policyObject.controls?.auth?.liveConfigurationStatus),
    corsEnforcement: classifyDeclaredState(policyObject.controls?.cors?.liveEnforcementStatus),
    headerEnforcement: classifyDeclaredState(policyObject.controls?.headers?.liveEnforcementStatus),
  };

  for (const [name, state] of Object.entries(edgeStates)) {
    if (state === 'FAIL') {
      explicitFailure = true;
      blockers.push(`edge_${name}_failed`);
    } else if (state !== 'PASS') {
      blockers.push(`edge_${name}_unverified`);
    }
  }

  let attack20Status = 'UNVERIFIED';
  if (!attack20Evidence) {
    blockers.push('attack20_a01_a07_evidence_missing');
  } else if (attack20Evidence.__invalid) {
    explicitFailure = true;
    attack20Status = 'FAIL';
    blockers.push('attack20_a01_a07_evidence_invalid');
  } else {
    attack20Status = normalizeAttackStatus(
      attack20Evidence.networkIngressStatus
      || attack20Evidence.status
      || attack20Evidence.overallStatus,
    );
    if (attack20Status === 'FAIL') {
      explicitFailure = true;
      blockers.push('attack20_a01_a07_failed');
    } else if (attack20Status !== 'PASS') {
      blockers.push('attack20_a01_a07_unverified');
    }
  }

  const allWitnessesPass = requiredWitnesses.every((witness) => witnessState[witness] === 'success');
  const allEdgesPass = Object.values(edgeStates).every((state) => state === 'PASS');
  const status = explicitFailure
    ? 'FAIL'
    : (
      allWitnessesPass
      && allEdgesPass
      && releaseEvidenceState === 'PASS'
      && schemaState === 'PASS'
      && attack20Status === 'PASS'
        ? 'PASS'
        : 'UNVERIFIED'
    );

  return {
    kind: 'firewall-fingerprint',
    version: 1,
    generatedAt,
    repository,
    expectedSha: normalizedExpected,
    status,
    nonAveraging: true,
    authority: {
      canonicalRuntime: 'cloudflare-pages-workers-plus-supabase',
      supportiveProviders: {
        vercel: {
          authoritative: false,
          state: 'provider-local-signal-only',
        },
      },
    },
    policy: {
      version: String(policyObject.version),
      activationStage: policyObject.activationStage ?? null,
      productionProtectionStatus: policyObject.claims?.productionProtectionStatus ?? null,
      reason: policyObject.claims?.reason ?? null,
      primaryHosts: policyObject.cloudflare?.primaryHosts ?? [],
      activeWorker: policyObject.cloudflare?.activeWorker ?? null,
    },
    edgeStates,
    runtime: {
      releaseEvidenceState,
      releaseEvidenceSha: releaseShaFromEvidence(releaseEvidence) || null,
      supabaseSchemaState: schemaState,
      witnesses: witnessState,
    },
    attack20: {
      scope: 'A01-A07 NETWORK/INGRESS',
      status: attack20Status,
      evidenceRetained: Boolean(attack20Evidence && !attack20Evidence.__invalid),
    },
    blockers: [...new Set(blockers)],
  };
}

export function writeFirewallFingerprint(env = process.env) {
  const policyPath = env.FIREWALL_POLICY_PATH || 'security/firewall-v10.policy.json';
  const outputPath = env.FIREWALL_FINGERPRINT_PATH || 'artifacts/firewall-fingerprint.json';
  const releaseEvidencePath = env.CLOUDFLARE_EVIDENCE_PATH || 'artifacts/cloudflare-native-deploy.json';
  const schemaEvidencePath = env.SUPABASE_SCHEMA_EVIDENCE_PATH || 'artifacts/supabase-production-schema.json';
  const attack20EvidencePath = env.ATTACK20_EVIDENCE_PATH || 'artifacts/attack20-network-ingress.json';

  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const fingerprint = buildFirewallFingerprint({
    policy,
    expectedSha: env.EXPECTED_RELEASE_SHA || env.GITHUB_SHA,
    repository: env.GITHUB_REPOSITORY,
    stepOutcomes: parseOutcomes(env.FIREWALL_STEP_OUTCOMES),
    releaseEvidence: readJsonOptional(releaseEvidencePath),
    schemaEvidence: readJsonOptional(schemaEvidencePath),
    attack20Evidence: readJsonOptional(attack20EvidencePath),
  });

  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({path: outputPath, status: fingerprint.status, blockers: fingerprint.blockers}));
  return fingerprint;
}

const isDirectExecution = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  try {
    writeFirewallFingerprint();
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  }
}
