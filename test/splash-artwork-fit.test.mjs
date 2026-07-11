import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('splash artwork shows the full image on wide screens', async () => {
  const source = await read('screens/SplashScreen.tsx');
  assert.match(source, /resizeMode="contain"/);
  assert.match(source, /Math\.min\(/);
  assert.match(source, /Image\.resolveAssetSource/);
  assert.match(source, /art\.left \+ art\.width \* btn\.left/);
  assert.doesNotMatch(source, /resizeMode="cover"/);
});
