import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(readFileSync('config/founder-visual-authority.json', 'utf8'));
const authority = contract.visualAuthority;

test('founder remains the non-delegable visual authority', () => {
  assert.equal(contract.project, 'sekret-bip');
  assert.equal(authority.finalDecisionOwner, 'founder');
  assert.equal(authority.nonDelegable, true);
  assert.equal(authority.directionSource, 'explicit founder-approved vision, prompt, or specification');
});

test('Canva is reference-only and cannot override founder direction', () => {
  assert.equal(authority.canvaRole, 'visual communication and editable reference only');
  assert.match(authority.conflictRule, /lower layer must be corrected/i);
  assert.match(authority.conflictRule, /cannot override founder intent/i);
});

test('visual proof chain preserves founder precedence through runtime evidence', () => {
  assert.deepEqual(authority.precedence, [
    'founder',
    'founder-approved-direction',
    'canva-reference',
    'github-implementation',
    'playwright-runtime-proof',
  ]);
  assert.match(authority.githubRole, /machine-verifiable product contracts/i);
  assert.match(authority.runtimeProofRole, /exact-head browser evidence/i);
});

test('founder approval receipt is exact-head, provider-backed, scoped, and expires on movement', () => {
  const receipt = authority.approvalReceipt;
  assert.equal(receipt.marker, 'FOUNDER-VISUAL-APPROVAL v1');
  assert.equal(receipt.provider, 'github-pr-comment');
  assert.equal(receipt.requiredAuthorLogin, 'jussray');
  assert.equal(receipt.requiredAuthorAssociation, 'OWNER');
  assert.deepEqual(receipt.requiredDecisions, {
    governanceOnly: 'no-visual-regression',
    visualOrUnknownChange: 'visual-acceptance',
  });
  assert.equal(receipt.governanceOnlyIsAllowlisted, true);
  assert.equal(receipt.unexpectedPathRequiresVisualAcceptance, true);
  assert.deepEqual(receipt.binds, [
    'pull-request',
    'exact-head-sha',
    'exact-head-product-design-artifact-name',
    'decision-claim-scope',
  ]);
  assert.equal(receipt.staleWhenHeadMoves, true);
  assert.equal(receipt.runtimeProofIsNotApproval, true);
});
