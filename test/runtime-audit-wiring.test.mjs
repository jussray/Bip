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

test('parent link operations report failures through runtime audit', async () => {
  const source = await read('src/utils/parentLink.ts');
  assert.match(source, /captureRuntimeError/);
  assert.match(source, /auditParentLinkFailure/);
  for (const eventType of [
    'invite_generation_rpc_failed',
    'pending_invite_lookup_failed',
    'invite_redemption_rpc_failed',
    'linked_teen_lookup_failed',
    'linked_parent_lookup_failed',
    'link_revocation_rpc_failed',
  ]) {
    assert.match(source, new RegExp(eventType));
  }
  assert.doesNotMatch(source, /console\.warn/);
});

test('parent link audit metadata never includes the invite code', async () => {
  const source = await read('src/utils/parentLink.ts');
  assert.doesNotMatch(source, /metadata:\s*\{[^}]*invite_code/s);
  assert.doesNotMatch(source, /metadata:\s*\{[^}]*normalized/s);
});

test('runtime audit sanitizes private content before persistence', async () => {
  const source = await read('src/services/runtimeAudit.ts');
  for (const blocked of ['journalText', 'rawAudio', 'access_token', 'transcript', 'messageText']) {
    assert.match(source, new RegExp(blocked));
  }
  assert.match(source, /sanitizeMetadata/);
  assert.match(source, /ingestAuditEvent/);
});
