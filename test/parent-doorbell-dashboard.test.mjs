import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent doorbell reads only approved Bridge metadata', async () => {
  const source = await read('src/features/parent/useParentDoorbell.ts');
  assert.match(source, /from\('bridge_signals'\)/);
  assert.match(source, /id,share_type,char_key,conv_mode,sent_at/);
  assert.doesNotMatch(source, /journal_entries|voice_notes|message_text|content/);
});

test('parent dashboard states the privacy boundary', async () => {
  const source = await read('app/(parent)/dashboard.tsx');
  assert.match(source, /Only what your teen chooses to share/);
  assert.match(source, /No private journals, voice notes, or companion conversations/);
  assert.match(source, /The doorbell/);
});

test('parent more links to the doorbell dashboard', async () => {
  const source = await read('app/(parent)/more.tsx');
  assert.match(source, /The Doorbell/);
  assert.match(source, /\(parent\)\/dashboard/);
});
