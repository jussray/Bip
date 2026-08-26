import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = 'supabase/migrations/20260826004000_reconcile_reward_approval_live_and_replay.sql';

const readMigration = () => readFile(new URL(`../${migrationPath}`, import.meta.url), 'utf8');
const readClient = () => readFile(new URL('../src/utils/parentApprovals.ts', import.meta.url), 'utf8');

test('reward migration recognizes both production and clean-replay owner columns', async () => {
  const sql = await readMigration();

  assert.match(sql, /column_name = 'user_id'/);
  assert.match(sql, /column_name = 'teen_id'/);
  assert.match(sql, /to_regclass\('public\.rewards'\) is not null/);
  assert.match(sql, /to_regclass\('public\.reward_catalog'\) is not null/);
  assert.match(sql, /raise exception 'reward_schema_lineage_unrecognized'/);
});

test('linked-parent reward reads require permanent account and active link in both lineages', async () => {
  const sql = await readMigration();
  const policyStart = sql.indexOf('drop policy if exists reward_redemptions_parent_select');
  const functionStart = sql.indexOf('-- Rebuild the two SECURITY DEFINER RPCs');
  const policySection = sql.slice(policyStart, functionStart);

  assert.match(policySection, /public\.is_non_anonymous_user\(\)/g);
  assert.match(policySection, /reward_redemptions\.user_id/);
  assert.match(policySection, /reward_redemptions\.teen_id/);
  assert.equal((policySection.match(/pl\.status = 'active'/g) ?? []).length, 2);
  assert.equal((policySection.match(/pl\.is_active = true/g) ?? []).length, 2);
});

test('both reward SECURITY DEFINER variants reject anonymous sessions before privileged data access', async () => {
  const sql = await readMigration();

  assert.equal(
    (sql.match(/not public\.is_non_anonymous_user\(\)/g) ?? []).length,
    4,
    'request + review must be guarded in both schema variants',
  );
  assert.equal(
    (sql.match(/raise exception 'permanent_account_required' using errcode = '42501'/g) ?? []).length,
    4,
  );
  assert.equal((sql.match(/pl\.is_active = true/g) ?? []).length, 4);
});

test('parent approvals client queries and normalizes both reward schema lineages', async () => {
  const source = await readClient();

  assert.match(source, /reward:rewards\(id, name, description, point_cost\)/);
  assert.match(source, /\.eq\('user_id', teenId\)/);
  assert.match(source, /reward:reward_catalog\(id, slug, name, description, category, point_cost, fulfillment_type\)/);
  assert.match(source, /\.eq\('teen_id', teenId\)/);
  assert.match(source, /teen_id: String\(\(row as any\)\.user_id\)/);
  assert.match(source, /const rows = new Map<string, PendingRewardRedemption>\(\)/);
});

test('reward hardening preserves authenticated RPC entrypoints but removes anon execute', async () => {
  const sql = await readMigration();

  assert.match(sql, /revoke all on function public\.request_reward_redemption\(uuid\) from public, anon/);
  assert.match(sql, /grant execute on function public\.request_reward_redemption\(uuid\) to authenticated/);
  assert.match(sql, /revoke all on function public\.review_reward_redemption\(uuid,boolean,text\) from public, anon/);
  assert.match(sql, /grant execute on function public\.review_reward_redemption\(uuid,boolean,text\) to authenticated/);
});