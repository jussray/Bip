import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('default Playwright isolates rooms while CI executes the dedicated suite', async () => {
  const config = await read('playwright.config.ts');
  const workflow = await read('.github/workflows/playwright.yml');

  assert.match(config, /testDir: '\.\/e2e'/);
  assert.match(config, /'\*\*\/production-smoke\.spec\.ts'/);
  assert.match(config, /'\*\*\/rooms\/\*\*'/);
  assert.match(config, /playwright\.room\.config\.ts/);

  assert.match(workflow, /playwright\.room\.config\.ts/);
  assert.match(workflow, /test\/room-production-contract\.test\.mjs/);
  assert.match(workflow, /Run founder-preview room contract tests/);
  assert.match(workflow, /npm run test:e2e:rooms/);
});

test('Night required poses are fully represented in the Leonardo prompt pack', async () => {
  const manifest = JSON.parse(await read('config/room-production.manifest.json'));
  const promptPack = JSON.parse(await read('config/leonardo/night-asset-prompt-pack.json'));

  const required = new Set(manifest.characters.night.requiredPoses);
  const prompted = new Set(promptPack.poses.map((pose) => pose.id));

  for (const pose of required) {
    assert.equal(prompted.has(pose), true, `missing Night prompt for required pose: ${pose}`);
  }

  assert.equal(required.has('thinking'), true);
  assert.equal(required.has('moonChair'), true);
  assert.equal(prompted.has('thinking'), true);
  assert.equal(prompted.has('moonChair'), true);
});

test('room foreman normalizes camel-case IDs to canonical asset filenames', async () => {
  const foreman = await read('scripts/room-production-foreman.mjs');

  assert.match(foreman, /function fileToken\(value\)/);
  assert.match(foreman, /replace\(\/\(\[a-z0-9\]\)\(\[A-Z\]\)\/g, '\$1-\$2'\)/);
  assert.match(foreman, /const pose = fileToken\(item\.pose\)/);
  assert.match(foreman, /const phase = fileToken\(item\.phase\)/);
  assert.doesNotMatch(foreman, /\$\{item\.characterId\}-\$\{item\.pose\}\.png/);

  const fileToken = (value) => String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

  assert.equal(fileToken('moonChair'), 'moon-chair');
  assert.equal(fileToken('deepNight'), 'deep-night');
});
