import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const summaryContractPath = path.join(migrationsDir, '20260705050121_bridge_summary_contract.sql');
const permanentAccountGuardPath = path.join(
  migrationsDir,
  '20260629024952_block_anonymous_sessions_from_private_data.sql',
);

const summaryContract = fs.readFileSync(summaryContractPath, 'utf8');
const permanentAccountGuard = fs.readFileSync(permanentAccountGuardPath, 'utf8');

test('bridge authorization migration files exist at their canonical versioned paths', () => {
  assert.equal(fs.existsSync(summaryContractPath), true);
  assert.equal(fs.existsSync(permanentAccountGuardPath), true);
});

test('permanent-account helper is fail-closed for anonymous Supabase sessions', () => {
  assert.match(permanentAccountGuard, /create or replace function public\.is_non_anonymous_user\(\)/i);
  assert.match(permanentAccountGuard, /auth\.jwt\(\).*is_anonymous/i);
  assert.match(permanentAccountGuard, /= false/i);
  assert.match(permanentAccountGuard, /revoke all on function public\.is_non_anonymous_user\(\) from public, anon/i);
});

test('bridge summary contract removes legacy raw-content parent read paths', () => {
  assert.match(summaryContract, /drop policy if exists.*journal_entries.*linked_parent_read_shared/i);
  assert.match(summaryContract, /drop policy if exists.*mood_history.*linked_parent_read_shared/i);
  assert.match(summaryContract, /drop policy if exists bridge_shares_linked_parent_select/i);
});

test('create_bridge_share_request is security definer with a fixed search path', () => {
  assert.match(summaryContract, /create or replace function public\.create_bridge_share_request\(/i);
  assert.match(summaryContract, /security definer/i);
  assert.match(summaryContract, /set search_path = public/i);
});

test('create_bridge_share_request checks for null uid (blocks unauthenticated callers)', () => {
  assert.match(summaryContract, /v_teen_user_id uuid := auth\.uid\(\)/i);
  assert.match(summaryContract, /v_teen_user_id is null/i);
  assert.match(summaryContract, /raise exception 'unauthorized'/i);
});

test('create_bridge_share_request validates idempotency key and sources before writing', () => {
  assert.match(summaryContract, /p_idempotency_key/i);
  assert.match(summaryContract, /invalid_idempotency_key/i);
  assert.match(summaryContract, /sources_required/i);
  assert.match(summaryContract, /too_many_sources/i);
  assert.match(summaryContract, /invalid_source/i);
});

test('create_bridge_share_request requires an active parent link before writing', () => {
  assert.match(summaryContract, /active_parent_link_required/i);
  assert.match(summaryContract, /pl\.status = 'active'/i);
  assert.match(summaryContract, /pl\.is_active = true/i);
});

test('create_bridge_share_request execute is revoked from public and anon', () => {
  assert.match(
    summaryContract,
    /revoke execute on function public\.create_bridge_share_request\(.*\) from public, anon/i,
  );
});

test('create_bridge_share_request execute is granted only to authenticated', () => {
  assert.match(
    summaryContract,
    /grant execute on function public\.create_bridge_share_request\(.*\) to authenticated/i,
  );
  assert.doesNotMatch(summaryContract, /grant execute on function public\.create_bridge_share_request.*to anon/i);
});

test('revoke_bridge_share_request is security definer with a fixed search path', () => {
  assert.match(summaryContract, /create or replace function public\.revoke_bridge_share_request\(/i);
  assert.match(summaryContract, /security definer/i);
  assert.match(summaryContract, /set search_path = public/i);
});

test('revoke_bridge_share_request execute is revoked from public and anon', () => {
  assert.match(
    summaryContract,
    /revoke execute on function public\.revoke_bridge_share_request\(.*\) from public, anon/i,
  );
});

test('revoke_bridge_share_request execute is granted only to authenticated', () => {
  assert.match(
    summaryContract,
    /grant execute on function public\.revoke_bridge_share_request\(.*\) to authenticated/i,
  );
  assert.doesNotMatch(summaryContract, /grant execute on function public\.revoke_bridge_share_request.*to anon/i);
});

test('bridge_share_sources has no parent read policy', () => {
  assert.doesNotMatch(summaryContract, /bridge_share_sources_parent_select/i);
  assert.doesNotMatch(summaryContract, /create policy.*bridge_share_sources.*parent/i);
});

test('bridge_share_sources table comment affirms parent exclusion', () => {
  assert.match(summaryContract, /Parent policies intentionally expose none of these rows/i);
});

test('bridge_share_sources teen policies use self-ownership via bridge_share_requests join', () => {
  assert.match(summaryContract, /bridge_share_sources_teen_select/i);
  assert.match(summaryContract, /bridge_share_sources_teen_insert/i);
  assert.match(summaryContract, /r\.teen_user_id = auth\.uid\(\)/i);
});

test('parent summary access requires active link, unrevoked request, and ready/viewed status', () => {
  assert.match(summaryContract, /bridge_summaries_parent_select/i);
  assert.match(summaryContract, /r\.status in \('ready','viewed'\)/i);
  assert.match(summaryContract, /r\.revoked_at is null/i);
  assert.match(summaryContract, /pl\.status = 'active'/i);
  assert.match(summaryContract, /pl\.is_active = true/i);
});

test('parent request visibility requires active link, unrevoked, and ready/viewed status', () => {
  assert.match(summaryContract, /bridge_share_requests_parent_select/i);
  assert.match(summaryContract, /status in \('ready','viewed'\)/i);
  assert.match(summaryContract, /revoked_at is null/i);
});

test('bridge_delivery_preferences has only a teen owner policy, no parent policy', () => {
  assert.match(summaryContract, /bridge_delivery_preferences_owner_all/i);
  assert.match(summaryContract, /teen_user_id = auth\.uid\(\)/i);
  assert.doesNotMatch(summaryContract, /bridge_delivery_preferences_parent/i);
});
