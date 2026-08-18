import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

test('Cloudflare native deployment verifier is credential-minimal and action-pinned', () => {
  for (const required of [
    'ref: ${{ env.DEPLOYMENT_SHA }}',
    'persist-credentials: false',
    'test "$actual" = "$EXPECTED_RELEASE_SHA"',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    "environment: Production",
    "RELEASE_OBSERVATION_MODE: blocked",
    "      - 'components/**'",
  ]) {
    assert.ok(workflow.includes(required), `missing deployment workflow contract: ${required}`);
  }

  assert.ok(!/uses:\s+actions\/(?:checkout|setup-node|upload-artifact)@v\d+/u.test(workflow), 'production verifier actions must be SHA-pinned');
  assert.ok(!workflow.includes('persist-credentials: true'), 'production verifier checkout credentials must not persist');
});