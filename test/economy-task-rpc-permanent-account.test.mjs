import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = 'supabase/migrations/20260827061000_harden_economy_task_rpcs_permanent_accounts.sql';
const readMigration = () => readFile(new URL(`../${migrationPath}`, import.meta.url), 'utf8');

function functionBody(sql, functionName) {
  const marker = `create or replace function public.${functionName}`;
  const start = sql.indexOf(marker);
  assert.notEqual(start, -1, `missing ${functionName}`);
  const next = sql.indexOf('\ncreate or replace function public.', start + marker.length);
  const grants = sql.indexOf('\nrevoke all on function', start + marker.length);
  const candidates = [next, grants].filter(index => index !== -1);
  const end = candidates.length > 0 ? Math.min(...candidates) : sql.length;
  return sql.slice(start, end);
}

function assertPermanentAccountGuardBeforeDataAccess(body, firstDataPattern) {
  const guard = body.indexOf('if ');
  const permanentGate = body.indexOf('not public.is_non_anonymous_user()');
  const dataAccess = body.search(firstDataPattern);

  assert.notEqual(guard, -1, 'missing early guard');
  assert.notEqual(permanentGate, -1, 'missing permanent-account helper');
  assert.notEqual(dataAccess, -1, 'missing expected data access');
  assert.ok(permanentGate < dataAccess, 'anonymous rejection must happen before SECURITY DEFINER data access');
  assert.match(body, /raise exception 'permanent_account_required' using errcode = '42501'/);
}

test('inactivity adjustment rejects anonymous authenticated sessions before reading the event ledger', async () => {
  const sql = await readMigration();
  const body = functionBody(sql, 'apply_inactivity_point_adjustment');

  assertPermanentAccountGuardBeforeDataAccess(body, /select max\(occurred_at\)::date/);
  assert.match(body, /event_type not in \('app_opened', 'streak_milestone'\)/);
  assert.match(body, /daily_cap', 5/);
});

test('teen task submission rejects anonymous sessions before bypassing task RLS', async () => {
  const sql = await readMigration();
  const body = functionBody(sql, 'submit_bip_task');

  assertPermanentAccountGuardBeforeDataAccess(body, /select requires_approval, point_value/);
  assert.match(body, /where id = p_task_id\s+and teen_id = v_user/);
  assert.match(body, /insert into public\.task_submissions/);
});

test('parent task review requires a permanent account and an actually active parent link', async () => {
  const sql = await readMigration();
  const body = functionBody(sql, 'review_task_submission');

  assertPermanentAccountGuardBeforeDataAccess(body, /select ts\.teen_id, ts\.task_id, bt\.point_value/);
  assert.match(body, /pl\.status = 'active'/);
  assert.match(body, /pl\.is_active = true/);
  assert.match(body, /insert into public\.bip_events/);
  assert.match(body, /insert into public\.point_transactions/);
});

test('authenticated execute remains available only behind in-function authorization guards', async () => {
  const sql = await readMigration();

  for (const signature of [
    'public.apply_inactivity_point_adjustment()',
    'public.submit_bip_task(uuid,text,text)',
    'public.review_task_submission(uuid,boolean,text)',
  ]) {
    const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(sql, new RegExp(`revoke all on function ${escaped} from public, anon`));
    assert.match(sql, new RegExp(`grant execute on function ${escaped} to authenticated`));
  }
});

test('focused migration does not alter reward schema or inventory while reward lineage is audited separately', async () => {
  const sql = await readMigration();

  assert.doesNotMatch(sql, /create or replace function public\.(?:request|review)_reward_redemption/);
  assert.doesNotMatch(sql, /(?:insert into|update|delete from) public\.(?:rewards|reward_catalog|reward_redemptions)/i);
  assert.doesNotMatch(sql, /drop table/i);
});