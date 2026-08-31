import assert from 'node:assert/strict';
import test from 'node:test';

import {createJussProofFromTestLedger} from '../scripts/control-room-juss-proof.mjs';

const SHA = '579342699fc7fb394cf9684643756cdc8c9342a8';
const CURRENT_ID = '123e4567-e89b-42d3-a456-426614174000';
const PREVIOUS_ID = '223e4567-e89b-42d3-a456-426614174000';
const ISSUED_AT = '2026-08-24T15:30:00.000Z';

function baseLedger() {
  return {
    schemaVersion: 1,
    repository: 'jussray/Sekret-Bip',
    commitSha: SHA,
    branch: 'feat/actual-flow-v4-provenance',
    generatedAt: ISSUED_AT,
    source: {provider: 'github-check-runs', exactRef: 'commit-sha'},
    runner: {provider: 'github-actions', observerState: 'stable'},
    aggregate: {
      state: 'passed',
      counts: {total: 3, passed: 3, failed: 0, queued: 0, running: 0, skipped: 0, unknown: 0},
    },
    checks: [],
  };
}

test('juss-proof evidence digest is canonical across object key order', () => {
  const a = baseLedger();
  const b = {
    checks: [],
    aggregate: a.aggregate,
    runner: a.runner,
    source: a.source,
    generatedAt: a.generatedAt,
    branch: a.branch,
    commitSha: a.commitSha,
    repository: a.repository,
    schemaVersion: a.schemaVersion,
  };

  const receiptA = createJussProofFromTestLedger(a, {receiptId: CURRENT_ID, issuedAt: ISSUED_AT});
  const receiptB = createJussProofFromTestLedger(b, {receiptId: CURRENT_ID, issuedAt: ISSUED_AT});
  assert.equal(receiptA.evidence[0].sha256, receiptB.evidence[0].sha256);
});

test('juss-proof can explicitly supersede a prior compatible receipt', () => {
  const receipt = createJussProofFromTestLedger(baseLedger(), {
    receiptId: CURRENT_ID,
    issuedAt: ISSUED_AT,
    supersedes: [PREVIOUS_ID],
  });
  assert.deepEqual(receipt.supersedes, [PREVIOUS_ID]);
});

test('juss-proof rejects malformed or self-referential supersession IDs', () => {
  assert.throws(
    () => createJussProofFromTestLedger(baseLedger(), {
      receiptId: CURRENT_ID,
      issuedAt: ISSUED_AT,
      supersedes: ['not-a-receipt'],
    }),
    /invalid receipt ID/,
  );

  assert.throws(
    () => createJussProofFromTestLedger(baseLedger(), {
      receiptId: CURRENT_ID,
      issuedAt: ISSUED_AT,
      supersedes: [CURRENT_ID],
    }),
    /unique non-self receipt IDs/,
  );
});
