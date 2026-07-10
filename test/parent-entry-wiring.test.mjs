import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('root and parent layout use the shared parent entry resolver', async () => {
  const index = await read('app/index.tsx');
  const layout = await read('app/(parent)/_layout.tsx');
  assert.match(index, /resolveParentEntryState/);
  assert.match(index, /routeForParentEntry/);
  assert.match(layout, /resolveParentEntryState/);
  assert.doesNotMatch(layout, /AsyncStorage\.getItem\('parent_profile_done'\)/);
});

test('parent entry resolver requires an active Supabase link', async () => {
  const source = await read('src/services/parentEntryState.ts');
  assert.match(source, /fetchLinkedTeenId/);
  assert.match(source, /state: 'unlinked'/);
  assert.match(source, /state: 'active'/);
  assert.match(source, /getDevTestFamily/);
});

test('profile editing preserves stored fields and cannot mark onboarding complete', async () => {
  const source = await read('app/(parent)/profile.tsx');
  assert.match(source, /\.\.\.existing/);
  assert.doesNotMatch(source, /setItem\('parent_profile_done'/);
});
