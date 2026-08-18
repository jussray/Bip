import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyFounderDecision,
  findValidFounderApproval,
  parseFounderVisualApproval,
} from '../scripts/verify-founder-visual-approval.mjs';

const HEAD = '0123456789abcdef0123456789abcdef01234567';
const OTHER = '89abcdef0123456789abcdef0123456789abcdef';
const ARTIFACT = `product-design-playwright-${HEAD}`;

function comment({ login = 'jussray', association = 'OWNER', head = HEAD, artifact = ARTIFACT, decision = 'visual-acceptance', id = 42, body } = {}) {
  return {
    id,
    html_url: `https://github.com/jussray/Sekret-Bip/pull/999#issuecomment-${id}`,
    author_association: association,
    user: { login },
    body: body ?? [
      'FOUNDER-VISUAL-APPROVAL v1',
      `head-sha: ${head}`,
      `artifact: ${artifact}`,
      `decision: ${decision}`,
    ].join('\n'),
  };
}

test('parses the structured founder visual approval receipt', () => {
  assert.deepEqual(parseFounderVisualApproval(comment().body), {
    headSha: HEAD,
    artifact: ARTIFACT,
    decision: 'visual-acceptance',
  });
});

test('requires the receipt to be the complete normalized comment', () => {
  const quoted = ['I do not approve this yet.', '', 'FOUNDER-VISUAL-APPROVAL v1', `head-sha: ${HEAD}`, `artifact: ${ARTIFACT}`, 'decision: visual-acceptance'].join('\n');
  assert.equal(parseFounderVisualApproval(quoted), null);
});

test('governance-only allowlist uses no-visual-regression', () => {
  assert.equal(classifyFounderDecision([
    '.github/workflows/product-design-playwright-proof.yml',
    'config/founder-visual-authority.json',
    'scripts/verify-founder-visual-approval.mjs',
    'test/founder-visual-approval-receipt.test.mjs',
  ]), 'no-visual-regression');
});

test('any unexpected path requires visual acceptance', () => {
  assert.equal(classifyFounderDecision(['app/(teen)/room.tsx']), 'visual-acceptance');
  assert.equal(classifyFounderDecision([]), 'visual-acceptance');
});

test('accepts only an OWNER receipt with the required exact-head decision claim', () => {
  const receipt = findValidFounderApproval({
    comments: [comment({ decision: 'no-visual-regression' })],
    expectedHeadSha: HEAD,
    founderLogin: 'jussray',
    requiredDecision: 'no-visual-regression',
  });
  assert.equal(receipt?.founderLogin, 'jussray');
  assert.equal(receipt?.headSha, HEAD);
  assert.equal(receipt?.artifact, ARTIFACT);
  assert.equal(receipt?.decision, 'no-visual-regression');
});

test('latest matching founder receipt is authoritative', () => {
  assert.equal(findValidFounderApproval({
    comments: [comment({ id: 41, decision: 'no-visual-regression' }), comment({ id: 42, decision: 'changes-requested' })],
    expectedHeadSha: HEAD,
    founderLogin: 'jussray',
    requiredDecision: 'no-visual-regression',
  }), null);
});

test('opposite approval claim does not authorize', () => {
  assert.equal(findValidFounderApproval({
    comments: [comment({ decision: 'visual-acceptance' })],
    expectedHeadSha: HEAD,
    founderLogin: 'jussray',
    requiredDecision: 'no-visual-regression',
  }), null);
});

test('rejects approval from a non-founder identity', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ login: 'review-bot' })], expectedHeadSha: HEAD, founderLogin: 'jussray', requiredDecision: 'visual-acceptance' }), null);
});

test('rejects founder comments without OWNER association', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ association: 'COLLABORATOR' })], expectedHeadSha: HEAD, founderLogin: 'jussray', requiredDecision: 'visual-acceptance' }), null);
});

test('rejects stale approval after head movement', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ head: OTHER })], expectedHeadSha: HEAD, founderLogin: 'jussray', requiredDecision: 'visual-acceptance' }), null);
});

test('rejects a receipt naming the wrong visual packet', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ artifact: `product-design-playwright-${OTHER}` })], expectedHeadSha: HEAD, founderLogin: 'jussray', requiredDecision: 'visual-acceptance' }), null);
});
