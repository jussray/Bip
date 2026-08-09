import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const proof = fs.readFileSync(new URL('../scripts/codeql-pr-alert-proof.mjs', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/codeql-pr-alert-proof.yml', import.meta.url), 'utf8');

test('CodeQL aggregate gate accepts success only', () => {
  assert.match(
    proof,
    /codeqlCheck\.conclusion !== 'success'/,
    'cancelled, timed_out, action_required, stale, skipped, neutral, and failure conclusions must all fail closed',
  );
  assert.doesNotMatch(
    proof,
    /codeqlCheck\.conclusion === 'failure' \|\| currentHeadAlerts\.length > 0/,
    'the gate must not reject only explicit failure',
  );
});

test('CodeQL proof distinguishes unsettled analysis from settled failure', () => {
  assert.match(proof, /CODEQL_SETTLE_TIMEOUT_MS/);
  assert.match(proof, /proof_state=unsettled/);
  assert.match(proof, /JavaScript CodeQL analysis failed/);
  assert.match(proof, /CodeQL aggregate failed/);
  assert.match(proof, /currentHeadAlerts\.length > 0/);
});

test('terminal JavaScript failure wins over aggregate settling', () => {
  assert.match(
    proof,
    /if \(javascriptTerminal && javascriptAnalysisCheck\.conclusion !== 'success'\) break;/,
    'polling must stop as soon as JavaScript analysis reaches a terminal non-success conclusion',
  );
  const failureBranch = proof.indexOf("if (javascriptTerminal && !javascriptPassed) {");
  const unsettledBranch = proof.indexOf("if (!javascriptTerminal || !aggregateSettled) {");
  assert.notEqual(failureBranch, -1);
  assert.notEqual(unsettledBranch, -1);
  assert.ok(
    failureBranch < unsettledBranch,
    'a concrete executed JavaScript failure must be classified before aggregate settling ambiguity',
  );
});

test('workflow gives the proof more runtime than its settle window', () => {
  assert.match(workflow, /CODEQL_SETTLE_TIMEOUT_MS: '1080000'/);
  assert.match(workflow, /timeout-minutes: 25/);
});
