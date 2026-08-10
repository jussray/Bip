import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  evaluateWorkerWitness,
  evaluatePagesMarker,
  evaluateChecks,
  classifyReadiness,
  buildEvidence,
} from '../scripts/verify-production-release-witness.mjs';
import {validateProductionWitness} from '../scripts/publish-production-release-witness.mjs';
import {resolveWorkerReleaseSha, writeWorkerReleaseIdentity} from '../scripts/write-worker-release-identity.mjs';

const SHA = '45800cacabc531968d7dcaaa5ec505a66ef68ad1';
const OTHER_SHA = '60efa565913275740d62d1839df9f8221388ed84';

function successfulCheck() {
  return {
    name: 'Workers Builds: sekret-backend',
    status: 'completed',
    conclusion: 'success',
    started_at: '2026-08-10T00:00:00Z',
    completed_at: '2026-08-10T00:01:00Z',
  };
}

test('Workers Builds SHA is the build-time runtime identity authority', () => {
  assert.equal(resolveWorkerReleaseSha({WORKERS_CI_COMMIT_SHA: SHA}), SHA);
  assert.throws(
    () => resolveWorkerReleaseSha({WORKERS_CI_COMMIT_SHA: 'not-a-sha'}),
    /exact 40-character Git commit SHA/,
  );
});

test('runtime identity stamper writes the exact Workers Builds SHA', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-worker-release-'));
  const outputPath = path.join(dir, 'release-identity.generated.ts');
  const written = writeWorkerReleaseIdentity({env: {WORKERS_CI_COMMIT_SHA: SHA}, outputPath});
  assert.equal(written, SHA);
  assert.match(fs.readFileSync(outputPath, 'utf8'), new RegExp(SHA));
});

test('worker witness accepts exact baked SHA even when optional version tag is absent', () => {
  const worker = evaluateWorkerWitness({
    ok: true,
    releaseSha: SHA,
    version: {id: 'cloudflare-version-id', tag: null, timestamp: '2026-08-10T00:00:00Z'},
  }, SHA);
  assert.equal(worker.complete, true);
  assert.equal(worker.releaseSha, SHA);
  assert.equal(worker.versionId, 'cloudflare-version-id');
  assert.equal(worker.versionTag, null);
});

test('worker witness rejects stale or missing baked SHA', () => {
  assert.equal(evaluateWorkerWitness({ok: true, releaseSha: OTHER_SHA}, SHA).complete, false);
  assert.equal(evaluateWorkerWitness({ok: true}, SHA).complete, false);
});

test('full evidence is ready only when provider check, Pages, and runtime SHA agree', () => {
  const checks = evaluateChecks([successfulCheck()]);
  const pages = evaluatePagesMarker({commitSha: SHA, branch: 'main'}, SHA);
  const worker = evaluateWorkerWitness({ok: true, releaseSha: SHA, version: {id: 'v1'}}, SHA);
  assert.equal(classifyReadiness(checks, pages, worker), 'ready');
  const evidence = buildEvidence({
    repository: 'jussray/Sekret-Bip',
    sha: SHA,
    releaseUrl: 'https://sekretbip.net/.well-known/sekret-release.json',
    backendHealthUrl: 'https://api.sekretbip.net/health',
    checks,
    pages,
    worker,
    startedAtMs: 0,
    observedAtMs: 1,
    status: 'succeeded',
  });
  assert.equal(evidence.version, 5);
  assert.equal(evidence.identityAuthority, 'workers-build-sha-baked-into-runtime');
  assert.equal(validateProductionWitness(evidence, SHA).worker.releaseSha, SHA);
});

test('repo production lane actually uses the v5 witness contract', () => {
  const wrangler = fs.readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const workflow = fs.readFileSync(new URL('../.github/workflows/deploy-cloudflare.yml', import.meta.url), 'utf8');
  assert.match(wrangler, /^main = "worker\/release-entry\.ts"$/m);
  assert.match(wrangler, /^\[build\]$/m);
  assert.match(wrangler, /^command = "node scripts\/write-worker-release-identity\.mjs"$/m);
  assert.ok(workflow.includes('node scripts/verify-production-release-witness.mjs'));
  assert.ok(workflow.includes('node scripts/publish-production-release-witness.mjs'));
  assert.equal(workflow.includes('run: node scripts/verify-cloudflare-native-deploy.mjs'), false);
});
