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

test('parent layout blocks direct entry until parent onboarding is complete', async () => {
  const source = await read('app/(parent)/_layout.tsx');
  assert.match(source, /AsyncStorage\.getItem\('parent_profile_done'\)/);
  assert.match(source, /if \(isLoading \|\| !profileChecked\)/);
  assert.match(source, /if \(effectiveUserSide === 'teen'\) return <Redirect href="\/\(teen\)\/room"/);
  assert.match(source, /if \(effectiveUserSide !== 'parent'\) return <Redirect href="\/"/);
  assert.match(source, /if \(!profileDone\) return <Redirect href="\/\(onboarding\)\/parent-welcome"/);
  assert.match(source, /return <ParentTabs \/>/);
});

test('parent onboarding guard does not claim local storage is authorization', async () => {
  const source = await read('app/(parent)/_layout.tsx');
  assert.match(source, /Authentication and role separation are enforced globally by RouteBoundary/);
  assert.match(source, /This local guard only prevents an incomplete parent setup/);
});
