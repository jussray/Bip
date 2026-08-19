import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/cloudflare-branch-authority-apply.yml', import.meta.url), 'utf8');

function section(start, end) {
  const startIndex = workflow.indexOf(start);
  const endIndex = workflow.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing section start: ${start}`);
  assert.notEqual(endIndex, -1, `missing section end: ${end}`);
  return workflow.slice(startIndex, endIndex);
}

test('founder apply workflow is manual-only, exact-main pinned, dedicated-token only, and Production-gated', () => {
  assert.match(workflow, /name: Apply Cloudflare Worker Branch Authority Repair/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\npush:/);
  assert.match(workflow, /expected_main_sha:/);
  assert.match(workflow, /FIX_646_MAIN_ONLY_WORKER_BUILDS/);
  assert.match(workflow, /test \"\$GITHUB_ACTOR\" = \"jussray\"/);
  assert.match(workflow, /test \"\$EXPECTED_MAIN_SHA\" = \"\$GITHUB_SHA\"/);
  assert.match(workflow, /git ls-remote/);
  assert.match(workflow, /CLOUDFLARE_WORKERS_BUILDS_API_TOKEN/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /needs: preflight/);
  assert.match(workflow, /environment: Production/);
  assert.match(workflow, /actions\/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093/);
  assert.match(workflow, /VERIFIED_AFTER_FOUNDER_APPLY/);
});

test('read-only preflight persists reconstructable trigger state before Production approval', () => {
  const preflight = section('  preflight:', '  apply:');
  const beforeUploadIndex = preflight.indexOf('- name: Upload before-state rollback evidence');
  assert.ok(beforeUploadIndex > -1);
  assert.doesNotMatch(preflight, /environment: Production/);
  assert.match(preflight, /mode: 'preflight-before-mutation'/);
  assert.match(preflight, /schemaVersion: 3/);
  assert.match(preflight, /mutationPerformed: false/);
  assert.match(preflight, /verifiedForApply/);
  assert.match(preflight, /repo_connection_uuid/);
  assert.match(preflight, /build_token_uuid/);
  assert.match(preflight, /trigger_name/);
  assert.match(preflight, /root_directory/);
  assert.match(preflight, /path_includes/);
  assert.match(preflight, /path_excludes/);
  assert.match(preflight, /build_caching_enabled/);
  assert.match(preflight, /\/environment_variables/);
  assert.match(preflight, /cannot be safely retained in rollback evidence/);
  assert.match(preflight, /fs\.writeFileSync\(process\.env\.BEFORE_EVIDENCE_PATH/);
  assert.doesNotMatch(preflight, /method: 'PUT'/);
  assert.doesNotMatch(preflight, /method: 'DELETE'/);
  assert.doesNotMatch(preflight, /method: 'PATCH'/);
});

test('Production apply consumes the retained snapshot, rejects drift, and journals every mutation', () => {
  const apply = workflow.slice(workflow.indexOf('  apply:'));
  const downloadIndex = apply.indexOf('- name: Download retained before-state rollback evidence');
  const mutationIndex = apply.indexOf('- name: Apply repair from retained snapshot and journal every mutation');
  assert.ok(downloadIndex > -1 && mutationIndex > -1 && downloadIndex < mutationIndex);
  assert.match(apply, /environment: Production/);
  assert.match(apply, /beforeEvidenceSha256/);
  assert.match(apply, /status: 'running'/);
  assert.match(apply, /journal: \[\]/);
  assert.match(apply, /function assertCurrentMain\(\)/);
  assert.match(apply, /provider trigger state drifted after retained preflight snapshot/);
  assert.match(apply, /provider trigger state drifted before mutation/);
  assert.match(apply, /preview-trigger environment changed after preflight; refusing mutation/);
  assert.match(apply, /refusing trigger deletion because rollback environment is no longer empty/);
  assert.match(apply, /const record = \(entry\) =>/);
  assert.match(apply, /receipt\.journal\.push/);
  assert.match(apply, /method: 'PUT'/);
  assert.match(apply, /method: 'DELETE'/);
  assert.match(apply, /method: 'PATCH'/);
  assert.match(apply, /action: 'cancel-build'/);
  assert.match(apply, /action: 'delete-trigger'/);
  assert.match(apply, /action: 'patch-production-trigger'/);
  assert.match(apply, /post-mutation readback is not main-only/);
});

test('receipts fail closed without persisting raw provider messages', () => {
  assert.match(workflow, /providerStatus/);
  assert.match(workflow, /providerCodes/);
  assert.doesNotMatch(workflow, /payload\?\.errors\?\.map\(\(error\) => `\$\{error\.code/);
  const afterUpload = workflow.slice(workflow.indexOf('- name: Upload apply journal and after-state evidence'));
  assert.match(afterUpload, /if: always\(\)/);
  assert.match(afterUpload, /cloudflare-worker-branch-authority-apply-\$\{\{ github\.sha \}\}/);
  assert.match(afterUpload, /if-no-files-found: error/);
});
