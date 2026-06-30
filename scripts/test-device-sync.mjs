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

test('account and privacy schema exists and can be safely rerun', () => {
  const schema = read('db/schema.sql');
  assert.match(schema, /create table if not exists public\.accounts/);
  assert.match(schema, /anonymous_handle\s+text\s+not null/);
  assert.match(schema, /bip_id\s+text\s+not null unique/);
  assert.match(schema, /create table if not exists public\.parent_teen_invites/);
  assert.match(schema, /create table if not exists public\.parent_teen_links/);
  assert.match(schema, /create table if not exists public\.teen_guardian_shares/);
  assert.match(schema, /anonymous_name\s+text/);
  assert.match(schema, /identity_context\s+text/);
  assert.match(schema, /connection_status\s+text/);
  assert.match(schema, /drop policy if exists "accounts_self"/);
  assert.match(schema, /drop policy if exists "mood_history_self"/);
});

test('legacy API imports resolve to the canonical src implementation', () => {
  const bridge = read('utils/api.ts');
  const canonical = read('src/utils/api.ts');
  assert.match(bridge, /export \* from '\.\.\/src\/utils\/api'/);
  for (const name of ['fetchSekretReply', 'fetchSekretVoice', 'fetchSekretTranscribe']) {
    assert.match(canonical, new RegExp(`export async function ${name}`));
  }
});
