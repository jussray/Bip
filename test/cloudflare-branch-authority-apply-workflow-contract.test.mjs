import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const applyWorkflow = await readFile(new URL('../.github/workflows/cloudflare-branch-authority-apply.yml', import.meta.url), 'utf8');
const auditWorkflow = await readFile(new URL('../.github/workflows/cloudflare-branch-authority.yml', import.meta.url), 'utf8');
const targets = JSON.parse(await readFile(new URL('../config/cloudflare-targets.json', import.meta.url), 'utf8'));

test('provider topology is exactly one production Worker, one founder-gated alpha Worker, and one Pages project', () => {
  assert.equal(targets.production.worker.name, 'sekret-backend');
  assert.equal(targets.nonProduction.worker.name, 'sekret-backend-alpha');
  assert.equal(targets.production.pages.name, 'sekret-bip');
  assert.deepEqual(targets.providerInventory.workers, ['sekret-backend', 'sekret-backend-alpha']);
  assert.deepEqual(targets.providerInventory.pages, ['sekret-bip']);
});

test('founder apply remains manual-only, exact-main pinned, and Production-environment gated', () => {
  assert.match(applyWorkflow, /workflow_dispatch:/);
  assert.doesNotMatch(applyWorkflow, /\npush:/);
  assert.match(applyWorkflow, /expected_main_sha:/);
  assert.match(applyWorkflow, /FIX_646_MAIN_ONLY_WORKER_BUILDS/);
  assert.match(applyWorkflow, /test \"\$GITHUB_ACTOR\" = \"jussray\"/);
  assert.match(applyWorkflow, /git ls-remote/);
  assert.match(applyWorkflow, /environment: Production/);
  assert.match(applyWorkflow, /CLOUDFLARE_WORKERS_BUILDS_API_TOKEN/);
  assert.doesNotMatch(applyWorkflow, /CLOUDFLARE_API_TOKEN/);
});

test('repair mutates only sekret-backend and never treats alpha or Pages as production mutation targets', () => {
  assert.match(applyWorkflow, /const productionWorker = 'sekret-backend'/);
  assert.match(applyWorkflow, /const alphaWorker = 'sekret-backend-alpha'/);
  assert.match(applyWorkflow, /const pagesProject = 'sekret-bip'/);
  assert.match(applyWorkflow, /alphaWorkerMutationPerformed: false/);
  assert.match(applyWorkflow, /pagesMutationPerformed: false/);
  assert.match(applyWorkflow, /mutationAuthorized: false/);
  assert.doesNotMatch(applyWorkflow, /name: 'sekret',/);
  assert.doesNotMatch(applyWorkflow, /name: 'bip-mail',/);
  assert.doesNotMatch(applyWorkflow, /method: 'DELETE'/);
});

test('repair fails closed on unexpected multi-trigger production topology instead of deleting provider objects', () => {
  assert.match(applyWorkflow, /expected exactly one active build trigger; refusing automatic repair of a multi-trigger topology/);
  assert.match(applyWorkflow, /activeProductionTriggers\.length !== 1/);
  assert.match(applyWorkflow, /method: 'PATCH'/);
  assert.match(applyWorkflow, /method: 'PUT'/);
  assert.doesNotMatch(applyWorkflow, /delete-trigger/);
});

test('read-only audit uses the same current topology and keeps Pages as a separate authority gate', () => {
  assert.match(auditWorkflow, /const productionWorker = 'sekret-backend'/);
  assert.match(auditWorkflow, /const alphaWorker = 'sekret-backend-alpha'/);
  assert.match(auditWorkflow, /const pagesProject = 'sekret-bip'/);
  assert.match(auditWorkflow, /founderGatedObservationOnly: true/);
  assert.match(auditWorkflow, /separate-pages-authority-gate/);
  assert.doesNotMatch(auditWorkflow, /name: 'sekret',/);
  assert.doesNotMatch(auditWorkflow, /name: 'bip-mail',/);
});
