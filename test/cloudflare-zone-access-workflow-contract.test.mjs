import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/audit-cloudflare-zone-access-coverage.yml', 'utf8');

test('public front-door audit is exact-head, credential-minimal, read-only, and action-pinned', () => {
  for (const required of [
    'EXPECTED_HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}',
    'ref: ${{ env.EXPECTED_HEAD_SHA }}',
    'persist-credentials: false',
    'test "$actual" = "$EXPECTED_HEAD_SHA"',
    'test "$EXPECTED_HEAD_SHA" = "$current_main"',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    'CLOUDFLARE_ACCESS_API_TOKEN: ${{ secrets.CLOUDFLARE_ACCESS_API_TOKEN }}',
    'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    "scripts/audit-cloudflare-app-binding-authority.mjs",
    "test/cloudflare-app-binding-authority-audit.test.mjs",
    'CLOUDFLARE_APP_BINDING_EVIDENCE_PATH: artifacts/cloudflare-app-binding-authority.json',
    'artifacts/cloudflare-app-binding-authority.json',
    'name: cloudflare-zone-access-coverage-${{ env.EXPECTED_HEAD_SHA }}',
  ]) {
    assert.ok(workflow.includes(required), `missing public front-door workflow contract: ${required}`);
  }

  const dedicatedTokenIndex = workflow.indexOf('CLOUDFLARE_ACCESS_API_TOKEN: ${{ secrets.CLOUDFLARE_ACCESS_API_TOKEN }}');
  const generalTokenIndex = workflow.indexOf('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}');
  assert.ok(dedicatedTokenIndex >= 0 && generalTokenIndex >= 0, 'Access audit must receive dedicated and general token candidates');
  assert.ok(dedicatedTokenIndex < generalTokenIndex, 'dedicated Access token must remain the preferred Access candidate before the general fallback');

  const mainGateIndex = workflow.indexOf('- name: Require exact current main before Cloudflare secret use');
  const accessProviderIndex = workflow.indexOf('- name: Audit zone-scoped Access applications and policies');
  const bindingProviderIndex = workflow.indexOf('- name: Audit public app Pages and Worker binding authority');
  assert.ok(mainGateIndex >= 0, 'exact-current-main provider gate must exist');
  assert.ok(accessProviderIndex > mainGateIndex, 'Access provider reads must occur after exact-current-main verification');
  assert.ok(bindingProviderIndex > mainGateIndex, 'binding provider reads must occur after exact-current-main verification');

  const accessStep = workflow.slice(accessProviderIndex, bindingProviderIndex);
  const bindingStep = workflow.slice(bindingProviderIndex, workflow.indexOf('- name: Upload redacted public front-door evidence'));
  assert.ok(accessStep.includes("if: github.event_name != 'pull_request'"), 'Access provider read must stay secret-free on PRs');
  assert.ok(bindingStep.includes("if: github.event_name != 'pull_request'"), 'binding provider read must stay secret-free on PRs');
  assert.ok(bindingStep.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'), 'binding read must use only the general Cloudflare token');
  assert.ok(!bindingStep.includes('CLOUDFLARE_ACCESS_API_TOKEN'), 'binding read must not receive the Access token');

  assert.ok(!workflow.includes('ref: ${{ github.sha }}'), 'public front-door audit must not validate the synthetic PR merge SHA');
  assert.ok(!/uses:\s+actions\/(?:checkout|setup-node|upload-artifact)@v\d+/u.test(workflow), 'security-sensitive actions must be SHA-pinned');
  assert.ok(!workflow.includes('CLOUDFLARE_WORKERS_BUILDS_API_TOKEN: ${{ secrets.CLOUDFLARE_WORKERS_BUILDS_API_TOKEN }}'), 'public front-door audit must not receive the Workers Builds token');
  assert.ok(!/\brun:\s+.*(?:--apply|DELETE|POST|PATCH|PUT)/u.test(workflow), 'public front-door workflow must not expose a mutation command');
});
