import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const delegated = read('worker/sekret-reply.ts');
const runtimeStyle = read('worker/runtime-style.ts');
const styles = read('src/features/sekret/styleProfiles.ts');
const fallback = read('src/features/sekret/naturalFallbacks.ts');

test('canonical companion authority cannot regress behind the router', () => {
  assert.doesNotMatch(delegated, /type CharacterId = 'raylene' \| 'rylane'/);
  assert.doesNotMatch(delegated, /CHARACTER: Raylene/);
  assert.doesNotMatch(delegated, /CHARACTER: Rylane/);
  assert.match(delegated, /CHARACTER: Suhana/);
  assert.match(delegated, /CHARACTER: Sy/);
});

test('inner prompt cannot contradict current HUMAN-AI identity authority', () => {
  assert.doesNotMatch(delegated, /Never say ["']as an AI/);
  assert.match(runtimeStyle, /HUMAN-AI|AI-transparent companion/);
  assert.match(styles, /HUMAN-AI|AI companion mode/);
});

test('deterministic fallback keeps explicit high-risk language on safety path', () => {
  const safetyLine = fallback.match(/const SAFETY_PATTERN = ([^;]+);/)?.[1] ?? '';
  assert.ok(safetyLine.length > 0);
  for (const requiredFragment of ['end my life', 'want to die', 'hurt myself', 'cut myself', 'emergency']) {
    assert.ok(safetyLine.includes(requiredFragment), `missing safety fragment: ${requiredFragment}`);
  }
});

test('public progress receipts bind current claims to exact-head evidence', () => {
  const source = read('scripts/public-progress-receipt.mjs');
  assert.match(source, /headSha must be an exact 40-char git SHA/);
  assert.match(source, /currentOnlyIfHeadMatches: true/);
  assert.match(source, /proofState/);
  assert.match(source, /superseded/);
});
