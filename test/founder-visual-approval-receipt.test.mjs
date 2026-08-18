import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findValidFounderApproval,
  parseFounderVisualApproval,
} from '../scripts/verify-founder-visual-approval.mjs';

const HEAD = '0123456789abcdef0123456789abcdef01234567';
const OTHER = '89abcdef0123456789abcdef0123456789abcdef';
const ARTIFACT = `product-design-playwright-${HEAD}`;

function comment({
  login = 'jussray',
  association = 'OWNER',
  head = HEAD,
  artifact = ARTIFACT,
  decision = 'approved',
  id = 42,
  body,
} = {}) {
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
    decision: 'approved',
  });
});

test('requires the receipt to be the complete normalized comment', () => {
  const quoted = [
    'I do not approve this yet.',
    '',
    'FOUNDER-VISUAL-APPROVAL v1',
    `head-sha: ${HEAD}`,
    `artifact: ${ARTIFACT}`,
    'decision: approved',
  ].join('\n');

  assert.equal(parseFounderVisualApproval(quoted), null);
});

test('accepts only an OWNER-authored approval bound to exact head and artifact', () => {
  const receipt = findValidFounderApproval({ comments: [comment()], expectedHeadSha: HEAD, founderLogin: 'jussray' });
  assert.equal(receipt?.founderLogin, 'jussray');
  assert.equal(receipt?.headSha, HEAD);
  assert.equal(receipt?.artifact, ARTIFACT);
  assert.equal(receipt?.decision, 'approved');
});

test('latest matching founder receipt is authoritative', () => {
  assert.equal(findValidFounderApproval({
    comments: [comment({ id: 41, decision: 'approved' }), comment({ id: 42, decision: 'changes-requested' })],
    expectedHeadSha: HEAD,
    founderLogin: 'jussray',
  }), null);
});

test('a later approval can supersede an earlier matching non-approval', () => {
  const receipt = findValidFounderApproval({
    comments: [comment({ id: 41, decision: 'changes-requested' }), comment({ id: 42, decision: 'approved' })],
    expectedHeadSha: HEAD,
    founderLogin: 'jussray',
  });
  assert.equal(receipt?.commentId, 42);
  assert.equal(receipt?.decision, 'approved');
});

test('rejects approval from a non-founder identity', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ login: 'review-bot' })], expectedHeadSha: HEAD, founderLogin: 'jussray' }), null);
});

test('rejects founder comments without OWNER association', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ association: 'COLLABORATOR' })], expectedHeadSha: HEAD, founderLogin: 'jussray' }), null);
});

test('rejects stale approval after head movement', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ head: OTHER })], expectedHeadSha: HEAD, founderLogin: 'jussray' }), null);
});

test('rejects an approval naming the wrong visual packet', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ artifact: `product-design-playwright-${OTHER}` })], expectedHeadSha: HEAD, founderLogin: 'jussray' }), null);
});

test('rejects explicit non-approval decisions', () => {
  assert.equal(findValidFounderApproval({ comments: [comment({ decision: 'changes-requested' })], expectedHeadSha: HEAD, founderLogin: 'jussray' }), null);
});
