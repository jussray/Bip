import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const script = path.join(root, 'scripts/public-progress-receipt.mjs');

function run(input) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sekret-progress-'));
  const inputPath = path.join(dir, 'input.json');
  const jsonPath = path.join(dir, 'receipt.json');
  const mdPath = path.join(dir, 'post.md');
  fs.writeFileSync(inputPath, JSON.stringify(input));
  const result = spawnSync(process.execPath, [script, inputPath, jsonPath, mdPath], { encoding: 'utf8' });
  return {
    ...result,
    receipt: fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : null,
    post: fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : null,
  };
}

const base = {
  repo: 'jussray/Sekret-Bip',
  headSha: '52878508fbfcd2ee5441f6afa91f2ec8b6a12e5e',
  observedAt: '2026-08-17T19:30:00Z',
  proofState: 'verified',
  claim: 'Companion runtime truth was hardened against stale authority.',
  publicEvidence: { tests: 'green', runtimeProof: 'exact-head' },
};

test('binds a public claim to exact SHA and observation time', () => {
  const result = run(base);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.receipt.validForHead, base.headSha);
  assert.equal(result.receipt.currentOnlyIfHeadMatches, true);
  assert.match(result.post, /As of 2026-08-17T19:30:00.000Z/);
  assert.match(result.post, /@5287850/);
});

test('supports superseded truth without rewriting history as false', () => {
  const result = run({ ...base, proofState: 'superseded', supersedes: 'historical-pr-559' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.receipt.proofState, 'superseded');
  assert.equal(result.receipt.supersedes, 'historical-pr-559');
});

test('rejects sauce-bearing public evidence fields', () => {
  const result = run({ ...base, publicEvidence: { tests: 'green', prompts: ['private system prompt'] } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden field/);
});

test('rejects floating claims without an exact commit SHA', () => {
  const result = run({ ...base, headSha: 'main' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exact 40-char git SHA/);
});
