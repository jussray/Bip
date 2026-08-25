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

test('Production Smoke binds proof to exact deployed or PR source and schedules all direct Playwright dependencies', () => {
  assert.match(content, /workflows: \["Verify Cloudflare Native Deployment"\]/);
  assert.match(content, /pull_request:/);
  assert.match(content, /playwright\.production\.config\.ts/);
  assert.match(content, /e2e\/production-\*\.spec\.ts/);
  assert.match(content, /scripts\/playwright-executable\.mjs/);
  assert.match(
    content,
    /EXPECTED_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/,
  );
  assert.match(content, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(content, /ref: \$\{\{ env\.EXPECTED_HEAD_SHA \}\}/);
  assert.match(content, /persist-credentials: false/);
  assert.match(content, /actual="\$\(git rev-parse HEAD\)"/);
  assert.match(content, /test "\$actual" = "\$EXPECTED_HEAD_SHA"/);
  assert.match(content, /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/);
  assert.match(content, /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.match(content, /actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02/);
  assert.doesNotMatch(content, /workflows: \["Deploy to Cloudflare"\]/);
  assert.doesNotMatch(content, /npm install --no-save --no-package-lock @playwright\/test/);
});
