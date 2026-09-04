import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync(
  new URL('../.github/workflows/app-domain-founder-command.yml', import.meta.url),
  'utf8',
);

const appDomainJob = workflow.slice(
  workflow.indexOf('  dispatch:\n'),
  workflow.indexOf('  dispatch-supabase-history:\n'),
);
const supabaseHistoryJob = workflow.slice(workflow.indexOf('  dispatch-supabase-history:\n'));

test('app-domain founder command is bound to active launch gate 925 and founder authority', () => {
  assert.match(workflow, /issue_comment:/);
  assert.match(appDomainJob, /github\.event\.issue\.number == 925/);
  assert.doesNotMatch(appDomainJob, /github\.event\.issue\.number == 825/);
  assert.match(appDomainJob, /github\.event\.comment\.user\.login == 'jussray'/);
  assert.match(appDomainJob, /startsWith\(github\.event\.comment\.body, '\/reconcile-app-domain '\)/);
  assert.match(appDomainJob, /Expected exactly: \/reconcile-app-domain <40-char-main-sha> <approval-reference>/);
  assert.match(appDomainJob, /re\.fullmatch\(r'\[0-9a-f\]\{40\}', sha\)/);
});

test('app-domain bridge verifies exact current main before dispatching only its existing bounded reconcile', () => {
  assert.match(appDomainJob, /\/git\/ref\/heads\/main/);
  assert.match(appDomainJob, /test "\$CURRENT_MAIN_SHA" = "\$EXPECTED_HEAD_SHA"/);
  assert.match(appDomainJob, /reconcile-cloudflare-app-domain\.yml\/dispatches/);
  assert.match(appDomainJob, /"apply":true/);
  assert.doesNotMatch(appDomainJob, /wrangler deploy/);
  assert.doesNotMatch(appDomainJob, /CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(appDomainJob, /CLOUDFLARE_ACCOUNT_ID/);
  assert.doesNotMatch(appDomainJob, /SUPABASE_ACCESS_TOKEN/);
  assert.doesNotMatch(appDomainJob, /reconcile-supabase-production-history/);
});

test('Supabase history command remains a separate founder-bound dispatcher', () => {
  assert.match(supabaseHistoryJob, /github\.event\.issue\.number == 925/);
  assert.match(supabaseHistoryJob, /github\.event\.comment\.user\.login == 'jussray'/);
  assert.match(supabaseHistoryJob, /startsWith\(github\.event\.comment\.body, '\/reconcile-supabase-history '\)/);
  assert.match(supabaseHistoryJob, /test "\$CURRENT_MAIN_SHA" = "\$EXPECTED_HEAD_SHA"/);
  assert.match(supabaseHistoryJob, /reconcile-supabase-production-history\.yml\/dispatches/);
  assert.doesNotMatch(supabaseHistoryJob, /SUPABASE_ACCESS_TOKEN/);
  assert.doesNotMatch(supabaseHistoryJob, /CLOUDFLARE_API_TOKEN/);
});