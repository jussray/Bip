import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync(
  new URL('../.github/workflows/app-domain-founder-command.yml', import.meta.url),
  'utf8',
);

test('app-domain founder command is bound to active launch gate 925 and founder authority', () => {
  assert.match(workflow, /issue_comment:/);
  assert.match(workflow, /github\.event\.issue\.number == 925/);
  assert.doesNotMatch(workflow, /github\.event\.issue\.number == 825/);
  assert.match(workflow, /github\.event\.comment\.user\.login == 'jussray'/);
  assert.match(workflow, /startsWith\(github\.event\.comment\.body, '\/reconcile-app-domain '\)/);
  assert.match(workflow, /Expected exactly: \/reconcile-app-domain <40-char-main-sha> <approval-reference>/);
  assert.match(workflow, /re\.fullmatch\(r'\[0-9a-f\]\{40\}', sha\)/);
});

test('bridge verifies exact current main before dispatching the existing bounded reconcile', () => {
  assert.match(workflow, /\/git\/ref\/heads\/main/);
  assert.match(workflow, /test "\$CURRENT_MAIN_SHA" = "\$EXPECTED_HEAD_SHA"/);
  assert.match(workflow, /reconcile-cloudflare-app-domain\.yml\/dispatches/);
  assert.match(workflow, /"apply":true/);
  assert.doesNotMatch(workflow, /wrangler deploy/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_ACCOUNT_ID/);
  assert.doesNotMatch(workflow, /supabase/);
});
