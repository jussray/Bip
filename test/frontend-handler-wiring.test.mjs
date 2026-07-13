import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('teen More has explicit Bridge and L4 handlers', async () => {
  const moreRoute = await read('app/(teen)/more.tsx');
  const routes = await read('src/teen/routes.ts');
  const sharedRoutes = await read('src/shared/routes.ts');

  assert.match(moreRoute, /screen === 'bridge'/);
  assert.match(moreRoute, /TEEN_ROUTES\.bridge/);
  assert.match(moreRoute, /screen === 'l4'.*screen === 'continuity'/s);
  assert.match(moreRoute, /TEEN_ROUTES\.l4/);

  assert.match(routes, /l4: '\/\(teen\)\/l4'/);
  assert.match(sharedRoutes, /bridge: TEEN_ROUTES\.bridge/);
  assert.match(sharedRoutes, /l4: TEEN_ROUTES\.l4/);
  assert.match(sharedRoutes, /continuity: TEEN_ROUTES\.l4/);
});

test('L4 entry is visible but remains read-only and honestly planned', async () => {
  const drawer = await read('src/constants/screenPurpose.ts');
  const screen = await read('app/(teen)/l4.tsx');
  const layout = await read('app/(teen)/_layout.tsx');

  assert.match(drawer, /label: 'Continuity', route: 'l4'/);
  assert.match(layout, /Tabs\.Screen name="l4" options=\{\{ href: null \}\}/);

  assert.match(screen, /PLANNED/);
  assert.match(screen, /not saving durable companion memory yet/i);
  assert.match(screen, /does not create, read, or store an L4 memory/i);
  assert.match(screen, /L4 continuity will not become a parent activity feed/i);
  assert.doesNotMatch(screen, /supabase|AsyncStorage|insert\(|update\(|upsert\(/i);
});
