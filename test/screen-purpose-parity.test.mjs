import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('screen purpose registry covers both teen and parent primary surfaces', async () => {
  const source = await read('src/constants/screenPurpose.ts');
  for (const side of ["side: 'teen'", "side: 'parent'"]) assert.match(source, new RegExp(side));
  for (const purpose of ['Visual home base', 'Journal and notebook hub', 'Comfort tools', 'Voice-first talk mode', 'Community', 'Feature drawer']) {
    assert.match(source, new RegExp(purpose));
  }
  for (const parentPurpose of ['Parent home base', 'Parent-owned notebook', 'Pause-before-replying', 'Shared signal hub']) {
    assert.match(source, new RegExp(parentPurpose));
  }
});

test('teen More is grouped and no longer a flat feature list', async () => {
  const source = await read('screens/MoreScreen.tsx');
  assert.match(source, /TEEN_MORE_GROUPS/);
  assert.match(source, /FEATURE DRAWER/);
  assert.match(source, /Room, Pages, Calm, Voice Bip, and Circle keep their own jobs/);
});

test('parent More is grouped without merging Doorbell and Parent Pages', async () => {
  const source = await read('app/(parent)/more.tsx');
  assert.match(source, /PARENT_MORE_GROUPS/);
  assert.match(source, /Doorbell shows only teen-shared signals/);
  assert.match(source, /Parent Pages stays yours/);
});

test('audit defines the same purpose discipline for both sides', async () => {
  const source = await read('docs/SCREEN_PURPOSE_AUDIT.md');
  assert.match(source, /### Teen side/);
  assert.match(source, /### Parent side/);
  assert.match(source, /A feature belongs on a screen only when it strengthens that screen’s single job/);
});
