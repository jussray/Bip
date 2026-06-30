import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Doorbell is owned by Bridge and not a separate primary surface', async () => {
  const source = await read('src/constants/screenPurpose.ts');
  assert.match(source, /id: 'bridge'.*Doorbell signals/s);
  assert.doesNotMatch(source, /id: 'doorbell'/);
});

test('Circle remains separate from family connection', async () => {
  const source = await read('src/constants/screenPurpose.ts');
  assert.match(source, /Circle'.*mustNotBecome: \['parent communication'/s);
  assert.match(source, /Parent Circle'.*mustNotBecome: \['teen Circle access', 'Bridge'/s);
});

test('S2Tell routes into Teen Bridge', async () => {
  const source = await read('app/(teen)/s2tell.tsx');
  assert.match(source, /from '@\/features\/bridge\/S2TellBridgeScreen'/);
});

test('former Doorbell route aliases Parent Bridge signals', async () => {
  const source = await read('app/(parent)/dashboard.tsx');
  assert.match(source, /\(parent\)\/bridge\?tab=signals/);
});

test('Bridge messages use the product-specific linked-account tables', async () => {
  const migration = await read('supabase/migrations/20260630004000_bridge_linked_accounts.sql');
  assert.match(migration, /bridge_signals/);
  assert.match(migration, /bridge_shares/);
  assert.match(migration, /parent_notes/);
  assert.doesNotMatch(migration, /circle_posts|parent_circle_posts|public_circle_posts/);
});

test('production side switching requires an explicit internal flag', async () => {
  const teen = await read('screens/MoreScreen.tsx');
  const parent = await read('app/(parent)/more.tsx');
  assert.match(teen, /EXPO_PUBLIC_ENABLE_SIDE_SWITCH/);
  assert.match(parent, /EXPO_PUBLIC_ENABLE_SIDE_SWITCH/);
});
