import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const WORKFLOW_PATH = '.github/workflows/deploy-supabase-migrations.yml';
const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');

function indexOfRequired(fragment) {
  const index = workflow.indexOf(fragment);
  assert.notEqual(index, -1, `Expected workflow to contain: ${fragment}`);
  return index;
}

function stepBlock(name, nextName) {
  const start = indexOfRequired(`- name: ${name}`);
  const end = nextName ? indexOfRequired(`- name: ${nextName}`) : workflow.length;
  assert.ok(start < end, `${name} must appear before ${nextName ?? 'workflow end'}.`);
  return workflow.slice(start, end);
}

test('production migration workflow is manual and dry-run by default', () => {
  assert.match(workflow, /on:\n  workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.doesNotMatch(workflow, /\n  pull_request:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /mode:[\s\S]*?default: dry-run/);
  assert.match(workflow, /confirm_project:/);
  assert.match(workflow, /apply_confirmation:/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('production migration workflow pins project and CLI while scoping secrets to required steps', () => {
  assert.match(workflow, /SUPABASE_PROJECT_REF: tbsevonvegdnlyjgplmm/);
  assert.match(workflow, /uses: supabase\/setup-cli@v1[\s\S]*?version: 2\.113\.0/);

  const workflowEnv = workflow.match(/\nenv:\n([\s\S]*?)\n\nconcurrency:/)?.[1] ?? '';
  assert.doesNotMatch(workflowEnv, /SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD/);

  const setupCli = stepBlock('Set up Supabase CLI', 'Verify production credentials');
  assert.doesNotMatch(setupCli, /secrets\.SUPABASE_ACCESS_TOKEN|secrets\.SUPABASE_DB_PASSWORD/);

  for (const [name, nextName] of [
    ['Verify production credentials', 'Link exact production project'],
    ['Link exact production project', 'Preview production migration plan'],
    ['Preview production migration plan', 'Re-verify current main immediately before apply'],
    ['Apply production migrations', 'Verify exact production schema after apply'],
  ]) {
    const block = stepBlock(name, nextName);
    assert.match(block, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
    assert.match(block, /SUPABASE_DB_PASSWORD: \$\{\{ secrets\.SUPABASE_DB_PASSWORD \}\}/);
  }

  const witness = stepBlock('Verify exact production schema after apply', 'Retain migration evidence');
  assert.match(witness, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.doesNotMatch(witness, /SUPABASE_DB_PASSWORD/);

  const upload = stepBlock('Retain migration evidence');
  assert.doesNotMatch(upload, /secrets\.SUPABASE_ACCESS_TOKEN|secrets\.SUPABASE_DB_PASSWORD/);
  assert.match(workflow, /test -n "\$SUPABASE_ACCESS_TOKEN"/);
  assert.match(workflow, /test -n "\$SUPABASE_DB_PASSWORD"/);
  assert.match(workflow, /supabase link --project-ref "\$SUPABASE_PROJECT_REF"/);
});

test('dry-run and apply are exact-current-main locked with an immediate pre-mutation recheck', () => {
  assert.match(workflow, /test "\$APPLY_CONFIRMATION" = 'APPLY PRODUCTION MIGRATIONS'/);
  const mainFetches = workflow.match(/git fetch --no-tags --depth=1 origin main/g) ?? [];
  assert.equal(mainFetches.length, 2, 'Current-main authority must be checked before dry-run and again immediately before apply.');
  assert.match(workflow, /Refusing to evaluate production migrations from a SHA that is no longer current main\./);
  assert.match(workflow, /current_main="\$\(git rev-parse FETCH_HEAD\)"/);
  assert.match(workflow, /test "\$TARGET_SHA" = "\$current_main"/);
  assert.match(workflow, /Main advanced after dry-run; refusing production migration apply\./);
  assert.match(workflow, /if: \$\{\{ inputs\.mode == 'apply' \}\}/);
});

test('dry-run and immediate main recheck always precede apply and post-apply exact schema witness', () => {
  const dryRun = indexOfRequired('supabase db push --linked --dry-run');
  const recheck = indexOfRequired('Re-verify current main immediately before apply');
  const apply = indexOfRequired('supabase db push --linked 2>&1 | tee artifacts/supabase-db-push-apply.txt');
  const witness = indexOfRequired('node scripts/verify-supabase-production-schema.mjs');

  assert.ok(dryRun < recheck, 'Dry-run must execute before the final current-main authority check.');
  assert.ok(recheck < apply, 'Current main must be re-verified immediately before production apply.');
  assert.ok(apply < witness, 'Exact production schema witness must execute after apply.');
  assert.doesNotMatch(workflow, /--include-all/);
  assert.doesNotMatch(workflow, /--include-seed/);
  assert.doesNotMatch(workflow, /migration repair/);
  assert.doesNotMatch(workflow, /psql\s|execute_sql|apply_migration/);
});

test('migration evidence is retained without weakening failed runs', () => {
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /artifacts\/supabase-db-push-dry-run\.txt/);
  assert.match(workflow, /artifacts\/supabase-db-push-apply\.txt/);
  assert.match(workflow, /artifacts\/supabase-production-schema\.json/);
});
