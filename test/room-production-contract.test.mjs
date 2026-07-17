import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('default Playwright excludes the founder-preview room suite', async () => {
  const config = await read('playwright.config.ts');

  assert.match(config, /testDir: '\.\/e2e'/);
  assert.match(config, /'\*\*\/production-smoke\.spec\.ts'/);
  assert.match(config, /'\*\*\/rooms\/\*\*'/);
  assert.match(config, /playwright\.room\.config\.ts/);
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
