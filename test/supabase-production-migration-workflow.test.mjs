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

test('production migration workflow pins project, CLI, and credentials', () => {
  assert.match(workflow, /SUPABASE_PROJECT_REF: tbsevonvegdnlyjgplmm/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.match(workflow, /SUPABASE_DB_PASSWORD: \$\{\{ secrets\.SUPABASE_DB_PASSWORD \}\}/);
  assert.match(workflow, /uses: supabase\/setup-cli@v1[\s\S]*?version: 2\.113\.0/);
  assert.match(workflow, /test -n "\$SUPABASE_ACCESS_TOKEN"/);
  assert.match(workflow, /test -n "\$SUPABASE_DB_PASSWORD"/);
  assert.match(workflow, /supabase link --project-ref "\$SUPABASE_PROJECT_REF"/);
});

test('apply is exact-current-main locked and requires explicit confirmation', () => {
  assert.match(workflow, /test "\$APPLY_CONFIRMATION" = 'APPLY PRODUCTION MIGRATIONS'/);
  assert.match(workflow, /git fetch --no-tags --depth=1 origin main/);
  assert.match(workflow, /current_main="\$\(git rev-parse FETCH_HEAD\)"/);
  assert.match(workflow, /test "\$TARGET_SHA" = "\$current_main"/);
  assert.match(workflow, /if: \$\{\{ inputs\.mode == 'apply' \}\}/);
});

test('dry-run always precedes apply and post-apply exact schema witness', () => {
  const dryRun = indexOfRequired('supabase db push --linked --dry-run');
  const apply = indexOfRequired('supabase db push --linked 2>&1 | tee artifacts/supabase-db-push-apply.txt');
  const witness = indexOfRequired('node scripts/verify-supabase-production-schema.mjs');

  assert.ok(dryRun < apply, 'Dry-run must execute before production apply.');
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
