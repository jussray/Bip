import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizeSarifDocuments} from '../scripts/codeql-pr-alert-proof.mjs';

const workflow = fs.readFileSync(new URL('../.github/workflows/codeql-pr-alert-proof.yml', import.meta.url), 'utf8');
const CODEQL_SHA = 'ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd';

function sarif(results = []) {
  return {
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          rules: [{
            id: 'js/example',
            properties: {'security-severity': '7.5'},
          }],
        },
      },
      results,
    }],
  };
}

test('local CodeQL workflow analyzes every current default-setup language on the deterministic runner', () => {
  assert.match(workflow, /name: Local CodeQL \(\$\{\{ matrix\.language \}\}\)/);
  assert.match(workflow, /runs-on:\s*ubuntu-22\.04/);
  assert.match(workflow, /- actions\s*\n\s*- javascript-typescript\s*\n\s*- python/);
  assert.match(workflow, /queries:\s*security-extended/);
});

test('local CodeQL action is immutable and never uploads competing Code Scanning results', () => {
  assert.match(workflow, new RegExp(`github/codeql-action/init@${CODEQL_SHA}`));
  assert.match(workflow, new RegExp(`github/codeql-action/analyze@${CODEQL_SHA}`));
  assert.match(workflow, /upload:\s*never/);
  assert.match(workflow, /upload-database:\s*false/);
  assert.doesNotMatch(workflow, /github\/codeql-action\/(?:init|analyze)@v\d+/);
  assert.doesNotMatch(workflow, /security-events:\s*write/);
});

test('local CodeQL SARIF summary is fail-closed on security findings', () => {
  const clean = summarizeSarifDocuments([sarif([])]);
  assert.equal(clean.runCount, 1);
  assert.equal(clean.findingCount, 0);

  const finding = summarizeSarifDocuments([sarif([{
    ruleId: 'js/example',
    level: 'error',
    message: {text: 'example security result'},
    locations: [{
      physicalLocation: {
        artifactLocation: {uri: 'src/example.ts'},
        region: {startLine: 4, endLine: 4},
      },
    }],
  }])]);
  assert.equal(finding.findingCount, 1);
  assert.equal(finding.findings[0].ruleId, 'js/example');
  assert.equal(finding.findings[0].securitySeverity, '7.5');
  assert.equal(finding.findings[0].path, 'src/example.ts');
});

test('local CodeQL proof preserves exact-head and evidence boundaries', () => {
  assert.match(workflow, /EXPECTED_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.match(workflow, /CODEQL_SARIF_DIR:/);
  assert.match(workflow, /EVIDENCE_DIR:/);
  assert.match(workflow, /node scripts\/codeql-pr-alert-proof\.mjs/);
  assert.match(workflow, /retention-days:\s*30/);
});
