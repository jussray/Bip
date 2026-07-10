import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent entry resolution uses the shared runtime audit wrapper', async () => {
  const source = await read('src/services/parentEntryState.ts');
  assert.match(source, /withRuntimeAudit/);
  assert.match(source, /'parent_window'/);
  assert.match(source, /entry_resolution_failed/);
  assert.match(source, /state: 'recovery'/);
});

test('runtime audit sanitizes private content before persistence', async () => {
  const source = await read('src/services/runtimeAudit.ts');
  for (const blocked of ['journalText', 'rawAudio', 'access_token', 'transcript', 'messageText']) {
    assert.match(source, new RegExp(blocked));
  }
  assert.match(source, /sanitizeMetadata/);
  assert.match(source, /ingestAuditEvent/);
});
