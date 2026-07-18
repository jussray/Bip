import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('controlled alpha activates built relationship surfaces without inventing L4', async () => {
  const flags = await read('src/constants/relationshipFeatureFlags.ts');

  assert.match(flags, /bridgeSummaries:\s*'enabled'/);
  assert.match(flags, /crewAccountability:\s*'enabled'/);
  assert.match(flags, /emotionalScrapbook:\s*'internal'/);
  assert.match(flags, /companionMemory:\s*'disabled'/);
  assert.match(flags, /FOUNDER_PREVIEWABLE_FEATURES[\s\S]*'emotionalScrapbook'/);
});

test('preview builds use the isolated alpha Worker while production stays canonical', async () => {
  const eas = JSON.parse(await read('eas.json'));

  assert.equal(
    eas.build.preview.env.EXPO_PUBLIC_BACKEND_URL,
    'https://sekret-backend-alpha.mcgill-raylene.workers.dev',
  );
  assert.equal(eas.build.preview.env.EXPO_PUBLIC_RELEASE_AUDIENCE, 'beta');
  assert.equal(
    eas.build['parent-preview'].env.EXPO_PUBLIC_BACKEND_URL,
    'https://sekret-backend-alpha.mcgill-raylene.workers.dev',
  );
  assert.equal(eas.build['parent-preview'].env.EXPO_PUBLIC_RELEASE_AUDIENCE, 'beta');
  assert.equal(
    eas.build.production.env.EXPO_PUBLIC_BACKEND_URL,
    'https://sekret-backend.mcgill-raylene.workers.dev',
  );
  assert.equal(eas.build.production.env.EXPO_PUBLIC_RELEASE_AUDIENCE, 'public');
});

test('alpha Worker enables Bridge generation without changing production wrangler config', async () => {
  const alpha = await read('wrangler.alpha.toml');
  const production = await read('wrangler.toml');

  assert.match(alpha, /name\s*=\s*"sekret-backend-alpha"/);
  assert.match(alpha, /BRIDGE_SUMMARIES_ROLLOUT\s*=\s*"enabled"/);
  assert.match(production, /BRIDGE_SUMMARIES_ROLLOUT\s*=\s*"disabled"/);
});
