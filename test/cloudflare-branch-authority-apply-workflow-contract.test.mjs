import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const applyWorkflow = await readFile(new URL('../.github/workflows/cloudflare-branch-authority-apply.yml', import.meta.url), 'utf8');
const auditWorkflow = await readFile(new URL('../.github/workflows/cloudflare-branch-authority.yml', import.meta.url), 'utf8');
const workerVerifier = await readFile(new URL('../scripts/verify-cloudflare-worker-branch-authority.mjs', import.meta.url), 'utf8');
const pagesVerifier = await readFile(new URL('../scripts/verify-cloudflare-pages-branch-authority.mjs', import.meta.url), 'utf8');
const targets = JSON.parse(await readFile(new URL('../config/cloudflare-targets.json', import.meta.url), 'utf8'));

test('provider topology preserves separate sekret, canonical backend, founder-gated alpha, and Pages authorities', () => {
  assert.equal(targets.production.worker.name, 'sekret-backend');
  assert.equal(targets.nonProduction.worker.name, 'sekret-backend-alpha');
  assert.equal(targets.production.pages.name, 'sekret-bip');
  assert.deepEqual(targets.providerInventory.workers, ['sekret', 'sekret-backend', 'sekret-backend-alpha']);
  assert.deepEqual(targets.providerInventory.pages, ['sekret-bip']);
  assert.equal(targets.separateWorkerAuthorities.sekret.status, 'founder-confirmed-active');
  assert.equal(targets.separateWorkerAuthorities.sekret.routeBinding, 'provider-readback-required');
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
  assert.match(applyWorkflow, /CLOUDFLARE_PAGES_READ_API_TOKEN/);
  assert.doesNotMatch(applyWorkflow, /CLOUDFLARE_API_TOKEN/);
});

test('founder repair mutates only canonical sekret-backend branch authority', () => {
  assert.match(applyWorkflow, /const productionWorker = 'sekret-backend'/);
  assert.match(applyWorkflow, /const alphaWorker = 'sekret-backend-alpha'/);
  assert.match(applyWorkflow, /const pagesProject = 'sekret-bip'/);
  assert.match(applyWorkflow, /alphaWorkerMutationPerformed: false/);
  assert.match(applyWorkflow, /pagesMutationPerformed: false/);
  assert.match(applyWorkflow, /mutationAuthorized: false/);
  assert.doesNotMatch(applyWorkflow, /method: 'DELETE'/);
  assert.equal(targets.separateWorkerAuthorities.sekret.mutationPolicy, 'preserve-until-exact-provider-binding-proven');
});

test('repair fails closed on unexpected multi-trigger production topology instead of deleting provider objects', () => {
  assert.match(applyWorkflow, /expected exactly one active build trigger; refusing automatic repair of a multi-trigger topology/);
  assert.match(applyWorkflow, /activeProductionTriggers\.length !== 1/);
  assert.match(applyWorkflow, /method: 'PATCH'/);
  assert.match(applyWorkflow, /method: 'PUT'/);
  assert.doesNotMatch(applyWorkflow, /delete-trigger/);
});

test('Pages authority is a load-bearing read and the audit delegates Worker truth to the read-only verifier', () => {
  assert.match(auditWorkflow, /verify-cloudflare-worker-branch-authority\.mjs/);
  assert.match(auditWorkflow, /verify-cloudflare-pages-branch-authority\.mjs/);
  assert.match(auditWorkflow, /CLOUDFLARE_PAGES_READ_API_TOKEN/);
  assert.doesNotMatch(auditWorkflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(auditWorkflow, /PAGES_EVIDENCE_PATH/);
  assert.match(workerVerifier, /verification: 'load-bearing-provider-readback'/);
  assert.match(applyWorkflow, /snapshot Pages branch authority before Worker mutation can be approved/);
  assert.match(applyWorkflow, /verify-cloudflare-pages-branch-authority\.mjs/);
  assert.match(applyWorkflow, /--expect-snapshot \"\$PAGES_EVIDENCE_PATH\"/);
  assert.match(applyWorkflow, /pagesReadback\?\.verified !== true/);
  assert.match(applyWorkflow, /pagesReadback\?\.snapshotMatched !== true/);
});

test('Pages verifier is read-only, dedicated-credential only, and checks current branch-control fields', () => {
  assert.match(pagesVerifier, /CLOUDFLARE_PAGES_READ_API_TOKEN/);
  assert.doesNotMatch(pagesVerifier, /CLOUDFLARE_API_TOKEN/);
  assert.match(pagesVerifier, /\/pages\/projects\//);
  assert.match(pagesVerifier, /production_deployments_enabled/);
  assert.match(pagesVerifier, /preview_deployment_setting/);
  assert.match(pagesVerifier, /productionBranch/);
  assert.match(pagesVerifier, /sourceType !== 'github'/);
  assert.match(pagesVerifier, /mutationPerformed: false/);
  assert.doesNotMatch(pagesVerifier, /method:\s*['"](?:PATCH|PUT|DELETE)['"]/);
});

test('read-only audit observes sekret separately while keeping backend branch repair isolated', () => {
  assert.match(auditWorkflow, /name: Audit Cloudflare Worker and Pages Branch Authority/);
  assert.match(auditWorkflow, /Read current two-Worker topology and verify production Worker branch authority/);
  assert.match(workerVerifier, /const separateWorker = 'sekret'/);
  assert.match(workerVerifier, /const productionWorker = 'sekret-backend'/);
  assert.match(workerVerifier, /const alphaWorker = 'sekret-backend-alpha'/);
  assert.match(workerVerifier, /const pagesProject = 'sekret-bip'/);
  assert.match(workerVerifier, /role: 'separate-protected'/);
  assert.match(workerVerifier, /bindingAuthority: 'provider-readback-required'/);
  assert.match(workerVerifier, /mutationAuthorized: false/);
  assert.match(workerVerifier, /founderGatedObservationOnly: true/);
  assert.match(workerVerifier, /mode: 'read-only'/);
  assert.match(workerVerifier, /mutationPerformed: false/);
});
