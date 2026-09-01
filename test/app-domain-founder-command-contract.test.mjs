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

/**
 * The file now carries two founder-command bridges. Scope each credential
 * assertion to its own job so a second bridge cannot quietly relax the first
 * one's guarantees, and so adding a third does not simply delete a check.
 */
const JOBS = (() => {
  const lines = workflow.split('\n');
  const jobsAt = lines.indexOf('jobs:');
  assert.notEqual(jobsAt, -1, 'workflow must declare jobs');

  const found = new Map();
  let current = null;

  for (const line of lines.slice(jobsAt + 1)) {
    const header = /^ {2}([a-z][\w-]*):\s*$/.exec(line);
    if (header) {
      current = header[1];
      found.set(current, []);
      continue;
    }
    if (current) found.get(current).push(line);
  }

  return new Map([...found].map(([name, body]) => [name, body.join('\n')]));
})();

function job(name) {
  const body = JOBS.get(name);
  assert.ok(body, `job ${name} must exist`);
  return body;
}

test('bridge verifies exact current main before dispatching the existing bounded reconcile', () => {
  const dispatch = job('dispatch');

  assert.match(dispatch, /\/git\/ref\/heads\/main/);
  assert.match(dispatch, /test "\$CURRENT_MAIN_SHA" = "\$EXPECTED_HEAD_SHA"/);
  assert.match(dispatch, /reconcile-cloudflare-app-domain\.yml\/dispatches/);
  assert.match(dispatch, /"apply":true/);

  // The bridge dispatches an existing bounded workflow. It must never hold
  // deploy credentials or reach another system itself.
  assert.doesNotMatch(dispatch, /wrangler deploy/);
  assert.doesNotMatch(dispatch, /CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(dispatch, /CLOUDFLARE_ACCOUNT_ID/);
  assert.doesNotMatch(dispatch, /SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|SUPABASE_SERVICE_ROLE/);
  assert.doesNotMatch(dispatch, /supabase db push|supabase migration|psql /);

  // The bridge states its own boundary in the run summary; keep it stating it.
  assert.match(dispatch, /Supabase\/database mutation in bridge: none/);
});

test('the Supabase history bridge holds no credentials and no mutation authority of its own', () => {
  const dispatch = job('dispatch-supabase-history');

  assert.match(dispatch, /github\.event\.issue\.number == 925/);
  assert.match(dispatch, /github\.event\.comment\.user\.login == 'jussray'/);
  assert.match(dispatch, /re\.fullmatch\(r'\[0-9a-f\]\{40\}', sha\)/);
  assert.match(dispatch, /test "\$CURRENT_MAIN_SHA" = "\$EXPECTED_HEAD_SHA"/);
  assert.match(dispatch, /reconcile-supabase-production-history\.yml\/dispatches/);

  assert.doesNotMatch(dispatch, /SUPABASE_ACCESS_TOKEN/);
  assert.doesNotMatch(dispatch, /SUPABASE_DB_PASSWORD/);
  assert.doesNotMatch(dispatch, /SUPABASE_SERVICE_ROLE/);
  assert.doesNotMatch(dispatch, /supabase db push|supabase migration|psql /);
  assert.doesNotMatch(dispatch, /CLOUDFLARE_API_TOKEN/);
});
