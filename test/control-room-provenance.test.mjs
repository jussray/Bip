import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ProvenanceError,
  bindClaim,
  canonicalSha256,
  createEvidenceBinding,
  createJsonEvidenceBinding,
  deterministicUuidV4,
  sha256File,
  supersedeClaim,
  verifyClaimBinding,
  verifyFileBinding,
} from '../scripts/control-room-provenance.mjs';

const OLD_AT = '2026-08-29T23:00:00.000Z';
const NEW_AT = '2026-08-30T09:00:00.000Z';

test('canonical hashing is stable across object key order', () => {
  const a = {impressions: 81, engagements: 6, nested: {b: 2, a: 1}};
  const b = {nested: {a: 1, b: 2}, engagements: 6, impressions: 81};
  assert.equal(canonicalSha256(a), canonicalSha256(b));
});

test('deterministic receipt IDs remain UUID-v4 compatible', () => {
  const idA = deterministicUuidV4({a: 1, b: 2});
  const idB = deterministicUuidV4({b: 2, a: 1});
  assert.equal(idA, idB);
  assert.match(idA, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('claim binding fails closed when observation changes', () => {
  const oldEvidence = createJsonEvidenceBinding({
    sourceId: 'linkedin-workbook-20260829',
    sourceKind: 'sanitized_metric_snapshot',
    observedAt: OLD_AT,
    source: {impressions: 81, engagements: 6},
  });
  const claim = bindClaim({
    claimId: 'LI-DAY-20260828-P04-aa03b1fd66d5',
    statement: 'Product Design/HCI is the winning format.',
    state: 'verified_current',
    evidence: oldEvidence,
    createdAt: '2026-08-29T23:05:00.000Z',
  });

  const mutatedEvidence = createJsonEvidenceBinding({
    sourceId: oldEvidence.sourceId,
    sourceKind: oldEvidence.sourceKind,
    observedAt: oldEvidence.observedAt,
    source: {impressions: 82, engagements: 6},
  });

  assert.throws(
    () => verifyClaimBinding(claim, mutatedEvidence),
    (error) => error instanceof ProvenanceError && error.code === 'claim_binding_mismatch',
  );
});

test('supersession preserves old evidence and binds the new observation', () => {
  const oldEvidence = createJsonEvidenceBinding({
    sourceId: 'linkedin-workbook-20260829',
    sourceKind: 'sanitized_metric_snapshot',
    observedAt: OLD_AT,
    source: {impressions: 81, engagements: 6},
  });
  const newEvidence = createJsonEvidenceBinding({
    sourceId: 'linkedin-workbook-20260830',
    sourceKind: 'sanitized_metric_snapshot',
    observedAt: NEW_AT,
    source: {impressions: 165, engagements: 6},
  });
  const claim = bindClaim({
    claimId: 'LI-DAY-20260828-P04-aa03b1fd66d5',
    statement: 'Product Design/HCI is the winning format.',
    state: 'verified_current',
    evidence: oldEvidence,
    createdAt: '2026-08-29T23:05:00.000Z',
  });

  const receipt = supersedeClaim({
    priorClaim: claim,
    oldEvidence,
    newEvidence,
    strategyMutation: 'Stop promoting the earlier format as a winner; require a mature read.',
  });

  assert.equal(receipt.priorState, 'superseded_historical');
  assert.equal(receipt.currentState, 'verified_current');
  assert.equal(receipt.oldEvidence.observationSha256, oldEvidence.observationSha256);
  assert.equal(receipt.newEvidence.observationSha256, newEvidence.observationSha256);
  assert.match(receipt.receiptSha256, /^[0-9a-f]{64}$/);
});

test('file binding detects byte-level source tampering', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-provenance-'));
  const filePath = path.join(root, 'evidence.json');
  fs.writeFileSync(filePath, '{"impressions":81,"engagements":6}\n', 'utf8');

  const evidence = createEvidenceBinding({
    sourceId: 'evidence-file',
    sourceKind: 'sanitized_metric_snapshot',
    observedAt: OLD_AT,
    sourceSha256: sha256File(filePath),
    observation: {impressions: 81, engagements: 6},
  });

  assert.equal(verifyFileBinding(evidence, filePath), true);
  fs.writeFileSync(filePath, '{"impressions":999,"engagements":999}\n', 'utf8');
  assert.throws(
    () => verifyFileBinding(evidence, filePath),
    (error) => error instanceof ProvenanceError && error.code === 'source_digest_mismatch',
  );
});
