import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = fs.readFileSync(
  path.join(repositoryRoot, '.github/workflows/production-smoke.yml'),
  'utf8',
);

test('Production Smoke follows the successful production verifier and binds proof to its exact main head', () => {
  assert.match(content, /workflows: \["Verify Cloudflare Native Deployment"\]/);
  assert.match(
    content,
    /EXPECTED_HEAD_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/,
  );
  assert.match(content, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(content, /ref: \$\{\{ env\.EXPECTED_HEAD_SHA \}\}/);
  assert.match(content, /actual="\$\(git rev-parse HEAD\)"/);
  assert.match(content, /test "\$actual" = "\$EXPECTED_HEAD_SHA"/);
  assert.doesNotMatch(content, /workflows: \["Deploy to Cloudflare"\]/);
});
