import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

// Structural/source-assertion coverage for SECURITY DEFINER trigger functions
// that previously had none. This is a stopgap, not a substitute for the live
// rollback-contained probes bip-supabase-guardian actually requires: Postgres
// refuses to invoke a `returns trigger` function outside trigger context even
// with EXECUTE granted, so these functions aren't exploitable the way a
// client-callable RPC is — but trigger_safety_scan() shipped a real bug
// (fixed in 20260701030000) that was invisible to source review and only
// caught by testing in a rolled-back transaction against a live table. These
// tests catch regressions and missing-hardening patterns; they do not prove
// runtime correctness the way a live probe would.

test('enforce_circle_anonymity blocks identity reveal on public/parent_community posts', async () => {
  const source = await read('supabase/migrations/20260701020000_circle_v2_parent_community.sql');
  const fn = source.match(/create or replace function public\.enforce_circle_anonymity\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(fn, 'expected enforce_circle_anonymity() definition');

  assert.match(fn, /security definer/);
  assert.match(fn, /set search_path = public/);
  assert.match(fn, /_kind in \('public', 'parent_community'\) and new\.is_identity_revealed is true/);
  assert.match(fn, /raise exception/);

  assert.match(source, /before insert or update on public\.posts/);
});

test('guard_crew_member_write rejects anonymous sessions and owner/id mismatch', async () => {
  const source = await read('supabase/migrations/20260714183100_remove_crew_caps_and_guard_relationships.sql');
  const fn = source.match(/create or replace function public\.guard_crew_member_write\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(fn, 'expected guard_crew_member_write() definition');

  // Relies on auth.uid()/auth.jwt() from the calling session — SECURITY
  // INVOKER (the default; no explicit clause) is the correct mode here.
  assert.doesNotMatch(fn, /security definer/);

  assert.match(fn, /v_is_anonymous boolean := coalesce\(\(auth\.jwt\(\) ->> 'is_anonymous'\)::boolean, false\)/);
  assert.match(fn, /if v_uid is null or v_is_anonymous then/);
  assert.match(fn, /raise exception 'permanent_account_required'/);
  assert.match(fn, /raise exception 'crew_owner_mismatch'/);
  // Acceptance fields (member_user_id, accepted_at, connection_status) must
  // be server-controlled, not settable by the inserting/updating client.
  assert.match(fn, /raise exception 'crew_acceptance_is_server_controlled'/);
  assert.match(fn, /raise exception 'crew_relationship_identity_is_immutable'/);
});

test('cleanup_crew_relationship_access is SECURITY DEFINER, effectively pinned, and not directly callable', async () => {
  const definitionSource = await read('supabase/migrations/20260714183500_harden_crew_membership_paths.sql');
  const lockSource = await read('supabase/migrations/20260714183600_lock_crew_function_search_paths.sql');
  const fn = definitionSource.match(/create or replace function public\.cleanup_crew_relationship_access\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(fn, 'expected cleanup_crew_relationship_access() definition');

  assert.match(fn, /security definer/);
  assert.match(definitionSource, /revoke all on function public\.cleanup_crew_relationship_access\(\) from public, anon, authenticated/);
  assert.match(definitionSource, /after update of connection_status on public\.crew_members/);

  // The effective search_path is locked by the follow-up migration after the
  // function body was qualified. Checking only the original CREATE text would
  // miss a later weakening/removal of the deployed function setting.
  assert.match(
    lockSource,
    /alter function public\.cleanup_crew_relationship_access\(\)\s+set search_path = pg_catalog, pg_temp/i,
  );
});

test('apply_point_transaction is SECURITY DEFINER, pinned, and not directly callable', async () => {
  const source = await read('supabase/migrations/20260703_reconcile_point_ledger_schema.sql');
  const fn = source.match(/create or replace function public\.apply_point_transaction\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(fn, 'expected apply_point_transaction() definition');

  assert.match(fn, /security definer/);
  assert.match(fn, /set search_path = public/);
  assert.match(source, /revoke all on function public\.apply_point_transaction\(\) from public, anon, authenticated/);

  assert.match(source, /after insert on public\.point_transactions/);
});

test('record_bridge_signal_activity is SECURITY DEFINER, pinned, and never stores Bridge content', async () => {
  const source = await read('supabase/migrations/20260714043000_humane_retention_loops.sql');
  const fn = source.match(/create or replace function public\.record_bridge_signal_activity\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(fn, 'expected record_bridge_signal_activity() definition');

  assert.match(fn, /security definer/);
  assert.match(fn, /set search_path = public/);

  // Only safe metadata may enter bip_events.meta — no message/content field.
  // (Not a bare /\btext\b/ check: new.id::text is a legitimate type cast,
  // not content storage, and would false-positive on that pattern.)
  const insertMatch = fn.match(/insert into public\.bip_events[\s\S]*?\)\)\s*\)/);
  assert.ok(insertMatch, 'expected the bip_events insert() call');
  assert.doesNotMatch(insertMatch[0], /'content'|'message'|new\.content\b|new\.message\b|new\.text\b/);

  assert.match(source, /after insert on public\.bridge_signals/);
});

test('trigger_safety_scan does not regress the historical dynamic-field-access bug', async () => {
  const source = await read('supabase/migrations/20260701030000_fix_trigger_safety_scan_dynamic_field_access.sql');

  // Scope regression checks to the function body only — the file's header
  // comment narrates the historical bug using the literal strings NEW.text /
  // NEW.body / CASE _col_name to explain it, which would false-positive
  // against the whole file.
  const fn = source.match(/create or replace function public\.trigger_safety_scan\(\)[\s\S]*?\$\$;/)?.[0];
  assert.ok(fn, 'expected trigger_safety_scan() definition');

  // The fix: resolve NEW's fields dynamically via to_jsonb(NEW) so Postgres
  // doesn't need both a `text` and a `body` column to exist on every
  // attached table at plan time.
  assert.match(fn, /_row := to_jsonb\(NEW\)/);
  assert.match(fn, /_content := _row ->> _col_name/);
  assert.match(fn, /_user_id := coalesce\(_row ->> 'user_id', _row ->> 'author_user_id'\)/);

  // The original bug: a static CASE branching directly on NEW.text / NEW.body
  // forces Postgres to resolve both branches against NEW's row type at plan
  // time, regardless of which one executes — so the function silently never
  // fired on any table that lacked both columns. Must not reappear in code.
  assert.doesNotMatch(fn, /CASE\s+_col_name/i);
  assert.doesNotMatch(fn, /NEW\.text\b/);
  assert.doesNotMatch(fn, /NEW\.body\b/);
});

// KNOWN GAP, tracked not hidden. auto_resolve_issue_on_event_resolve is
// SECURITY DEFINER but has no `set search_path` pin, unlike every other
// SECURITY DEFINER trigger function in this repo (enforce_circle_anonymity,
// cleanup_crew_relationship_access, apply_point_transaction,
// record_bridge_signal_activity, trigger_safety_scan all pin it). An
// unpinned search_path on a SECURITY DEFINER function is a real hardening
// gap (search_path hijacking risk), not a style nit — see
// .agents/skills/bip-supabase-guardian/SKILL.md's "set an explicit
// search_path" rule for SECURITY DEFINER functions. Flagged in SPRINT.md.
// Marked `todo` (not silently asserted away, not left as a hard CI failure
// for an unrelated PR to trip over) until a follow-up migration pins it —
// a live schema change wasn't in scope for adding tests. Remove the `todo`
// option in the same change that adds the fix.
test(
  'auto_resolve_issue_on_event_resolve pins search_path (SECURITY DEFINER)',
  { todo: 'known gap — SECURITY DEFINER without search_path pin, see SPRINT.md "Trigger function hardening"' },
  async () => {
    const source = await read('supabase/migrations/20260701_control_room_normalization.sql');
    const fn = source.match(/create or replace function public\.auto_resolve_issue_on_event_resolve\(\)[\s\S]*?\$\$;/)?.[0];
    assert.ok(fn, 'expected auto_resolve_issue_on_event_resolve() definition');

    assert.match(fn, /security definer/);
    assert.match(fn, /set search_path = public/, 'SECURITY DEFINER trigger functions must pin search_path — see SPRINT.md');
  },
);
