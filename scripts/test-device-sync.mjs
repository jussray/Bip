import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('root router protects authenticated areas through centralized route access', () => {
  const layout = read('app/_layout.tsx');
  const routeAccess = read('src/services/routeAccess.ts');

  assert.match(layout, /auth\.getSession\(\)/, 'root layout should resolve the current Supabase session');
  assert.match(layout, /onAuthStateChange/, 'root layout should react to sign-out and session changes');
  assert.match(layout, /router\.replace\('\/\(auth\)\/login'\)/, 'signed-out users should be sent to login');
  assert.match(layout, /decideRouteAccess/, 'root layout should delegate route policy centrally');
  assert.match(layout, /router\.replace\(decision\.redirectTo\)/, 'denied routes should use the centralized redirect');

  assert.match(routeAccess, /options\.userSide === 'parent'[\s\S]*redirectTo: '\/\(parent\)\/room'/s);
  assert.match(routeAccess, /area === '\(parent\)'[\s\S]*redirectTo: '\/\(teen\)\/room'/s);
  assert.match(routeAccess, /verification_required/);
  assert.match(routeAccess, /manual_review/);
  assert.match(routeAccess, /suspended/);
});

test('teen and parent bottom navigation use the same five destinations', () => {
  for (const path of ['app/(teen)/_layout.tsx', 'app/(parent)/_layout.tsx']) {
    const layout = read(path);
    const order = ['name="room"', 'name="pages"', 'name="calm"', 'name="circle"', 'name="more"'];
    let previous = -1;
    for (const marker of order) {
      const position = layout.indexOf(marker);
      assert.notEqual(position, -1, `${path} must include ${marker}`);
      assert.ok(position > previous, `${path} must order tabs Room, Pages, Calm, Circle, More`);
      previous = position;
    }
  }
});

test('privacy-relevant schema is defined in migrations and can be safely rerun', () => {
  // supabase/migrations/ is the single source of truth for schema (db/schema.sql
  // was retired — it had drifted from the real, currently-used design: dead
  // accounts/parent_teen_invites/parent_teen_links/teen_guardian_shares tables
  // that no app code ever read, superseded by parent_links + account_verification).
  const init = read('supabase/migrations/0001_init.sql');
  const consent = read('supabase/migrations/20260628_consent_visibility.sql');
  const crewColumns = read('supabase/migrations/20260702060000_crew_members_bip_id.sql');

  assert.match(init, /create table if not exists public\.mood_history/);
  assert.match(init, /create table if not exists public\.journal_entries/);
  assert.match(init, /create table if not exists public\.crew_members/);
  assert.match(init, /primary key \(user_id, id\)/, 'client-generated ids must be scoped per user, not global');
  assert.match(init, /drop policy if exists/, 'RLS policies must be re-creatable so the migration is safe to rerun');

  assert.match(consent, /ADD COLUMN IF NOT EXISTS visibility/);
  assert.match(consent, /journal_entries_visibility_check/);

  assert.match(crewColumns, /add column if not exists bip_id/);
  assert.match(crewColumns, /add column if not exists connection_status/);
});

test('legacy API imports resolve to the canonical src implementation', () => {
  const bridge = read('utils/api.ts');
  const canonical = read('src/utils/api.ts');
  assert.match(bridge, /export \* from '\.\.\/src\/utils\/api'/);
  for (const name of ['fetchSekretReply', 'fetchSekretVoice', 'fetchSekretTranscribe']) {
    assert.match(canonical, new RegExp(`export async function ${name}`));
  }
});
