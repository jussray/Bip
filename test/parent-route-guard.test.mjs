import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('root layout remains the global authentication and side boundary', async () => {
  const source = await read('app/_layout.tsx');
  assert.match(source, /function RouteBoundary/);
  assert.match(source, /isAuthResolved/);
  assert.match(source, /isAuthenticated/);
  assert.match(source, /decideRouteAccess/);
  assert.match(source, /getDevSplitViewSideOverride/);
});

test('parent layout blocks direct entry until the shared parent entry resolver allows access', async () => {
  const source = await read('app/(parent)/_layout.tsx');
  assert.match(source, /resolveParentEntryState/);
  assert.match(source, /entryState\.state === 'signed_out'/);
  assert.match(source, /entryState\.state === 'profile_required'/);
  assert.match(source, /entryState\.state !== 'active'/);
  assert.match(source, /return <ParentTabs \/>/);
  assert.doesNotMatch(source, /AsyncStorage\.getItem\('parent_profile_done'\)/);
});

test('parent route guard delegates readiness to the shared resolver', async () => {
  const source = await read('src/services/parentEntryState.ts');
  assert.match(source, /fetchLinkedTeenId/);
  assert.match(source, /parent_profile_data/);
  assert.match(source, /parent_profile_done/);
  assert.match(source, /linked_teen_id/);
});
