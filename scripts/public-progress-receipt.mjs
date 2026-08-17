#!/usr/bin/env node

import fs from 'node:fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('usage: node scripts/public-progress-receipt.mjs <input.json> [output.json] [output.md]');
  process.exit(2);
}

const outputJson = process.argv[3] || 'public-progress-receipt.json';
const outputMd = process.argv[4] || 'public-progress-post.md';
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const required = ['repo', 'headSha', 'observedAt', 'claim', 'proofState'];
for (const field of required) {
  if (typeof input[field] !== 'string' || !input[field].trim()) {
    throw new Error(`missing required field: ${field}`);
  }
}

if (!/^[0-9a-f]{40}$/i.test(input.headSha)) throw new Error('headSha must be an exact 40-char git SHA');
if (!['verified', 'partial', 'blocked', 'superseded'].includes(input.proofState)) throw new Error('invalid proofState');

const forbiddenKeys = new Set([
  'files', 'filenames', 'diff', 'patch', 'prompt', 'prompts', 'secret', 'secrets',
  'token', 'tokens', 'key', 'keys', 'env', 'environment', 'privateData', 'rawLogs',
  'architecture', 'implementation', 'sourceCode', 'sql', 'schemaDump', 'userContent',
]);

function assertPublicSafe(value, path = 'root') {
  if (!value || typeof value !== 'object') return;
  for (const [key, next] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) throw new Error(`public receipt contains forbidden field: ${path}.${key}`);
    assertPublicSafe(next, `${path}.${key}`);
  }
}

assertPublicSafe(input.publicEvidence ?? {});

const observedAt = new Date(input.observedAt);
if (Number.isNaN(observedAt.getTime())) throw new Error('observedAt must be ISO-compatible');

const receipt = Object.freeze({
  schemaVersion: 'sekret-public-progress-v1',
  repo: input.repo,
  headSha: input.headSha.toLowerCase(),
  observedAt: observedAt.toISOString(),
  proofState: input.proofState,
  claim: input.claim.trim(),
  publicEvidence: input.publicEvidence ?? {},
  supersedes: typeof input.supersedes === 'string' ? input.supersedes : null,
  validForHead: input.headSha.toLowerCase(),
  currentOnlyIfHeadMatches: true,
  publicSafe: true,
});

const badge = receipt.proofState === 'verified' ? '✅' : receipt.proofState === 'blocked' ? '⛔' : receipt.proofState === 'superseded' ? '↪️' : '🟡';
const post = [
  `${badge} ${receipt.claim}`,
  '',
  `Proof state: ${receipt.proofState}.`,
  `As of ${receipt.observedAt} on ${receipt.repo}@${receipt.headSha.slice(0, 7)}.`,
  '',
  'This is a public-safe progress receipt: outcome and proof are shareable; implementation details, private data, prompts, secrets, and source-level internals are intentionally withheld.',
].join('\n');

fs.writeFileSync(outputJson, `${JSON.stringify(receipt, null, 2)}\n`);
fs.writeFileSync(outputMd, `${post}\n`);
console.log(JSON.stringify({ outputJson, outputMd, headSha: receipt.headSha, proofState: receipt.proofState }));
