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

test('parent dashboard is a redirect alias into Bridge signals tab', async () => {
  const source = await read('app/(parent)/dashboard.tsx');
  assert.match(source, /\(parent\)\/bridge\?tab=signals/);
});

test('parent more screen describes Bridge as the connection hub', async () => {
  const source = await read('app/(parent)/more.tsx');
  assert.match(source, /Doorbell signals/);
  assert.match(source, /Bridge carries/);
  assert.match(source, /PARENT_MORE_GROUPS/);
});
