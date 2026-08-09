import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const proof = fs.readFileSync(new URL('../scripts/codeql-pr-alert-proof.mjs', import.meta.url), 'utf8');

test('CodeQL aggregate gate accepts success only', () => {
  assert.match(
    proof,
    /codeqlCheck\.conclusion !== 'success' \|\| currentHeadAlerts\.length > 0/,
    'cancelled, timed_out, action_required, stale, skipped, neutral, and failure conclusions must all fail closed',
  );
  assert.doesNotMatch(
    proof,
    /codeqlCheck\.conclusion === 'failure' \|\| currentHeadAlerts\.length > 0/,
    'the gate must not reject only explicit failure',
  );
});
