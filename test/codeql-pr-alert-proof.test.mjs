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

test('only a concrete executed JavaScript failure wins over aggregate settling', () => {
  assert.match(
    proof,
    /function isExecutedJavascriptFailure\(check\) \{\s*return check\?\.status === 'completed' && check\.conclusion === 'failure';\s*\}/,
    'early failure must be limited to the concrete failure conclusion',
  );
  assert.match(
    proof,
    /if \(isExecutedJavascriptFailure\(javascriptAnalysisCheck\)\) break;/,
    'polling may stop early only for a concrete executed JavaScript failure',
  );
  assert.doesNotMatch(
    proof,
    /javascriptAnalysisCheck\.conclusion !== 'success'\) break/,
    'startup_failure, cancelled, skipped, neutral, and other non-success infrastructure states must not be promoted to an executed analysis failure',
  );

  const failureBranch = proof.indexOf('if (javascriptExecutedFailure) {');
  const unsettledBranch = proof.indexOf('if (!javascriptTerminal || !javascriptPassed || !aggregateSettled) {');
  assert.notEqual(failureBranch, -1);
  assert.notEqual(unsettledBranch, -1);
  assert.ok(
    failureBranch < unsettledBranch,
    'a concrete executed JavaScript failure must be classified before aggregate settling ambiguity',
  );
});

test('non-executed terminal JavaScript conclusions remain unsettled', () => {
  assert.match(
    proof,
    /if \(!javascriptTerminal \|\| !javascriptPassed \|\| !aggregateSettled\) \{/,
    'terminal non-success states that are not concrete failures must remain unsettled instead of being diagnosed as code failure',
  );
  for (const conclusion of ['startup_failure', 'cancelled', 'skipped', 'neutral']) {
    assert.notEqual(conclusion, 'failure');
  }
});

test('workflow gives the proof more runtime than its settle window', () => {
  assert.match(workflow, /CODEQL_SETTLE_TIMEOUT_MS: '1080000'/);
  assert.match(workflow, /timeout-minutes: 25/);
});