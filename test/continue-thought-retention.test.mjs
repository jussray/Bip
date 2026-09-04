import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('Continue the Thought stores bookmark metadata only', () => {
  const continuation = read('src/features/retention/savedContinuation.ts');

  assert.match(continuation, /entryId: string/);
  assert.match(continuation, /companionKey: string/);
  assert.match(continuation, /savedAt: string/);
  assert.match(continuation, /sekretbip_saved_continuation_v1/);
  assert.doesNotMatch(
    continuation,
    /journalText|entryText|messageContent|transcript|summary|snippet|sekretReply/,
  );
});

test('Pages exposes an explicit save-for-later control and Room resumes the exact entry', () => {
  const detail = read('app/(teen)/pages/[id].tsx');
  const overlay = read('components/retention/BipReturnOverlay.tsx');

  assert.match(detail, /Save this page so you can continue it later/);
  assert.match(detail, /Room remembers this page, not a preview of what you wrote/);
  assert.match(detail, /saveContinuation\(\{/);
  assert.match(overlay, /continue your thought/);
  assert.match(overlay, /Continue where you left off/);
  assert.match(overlay, /\`\/\(teen\)\/pages\/\$\{continuation\.entryId\}\`/);
  assert.match(overlay, /Archive saved page/);
});

test('saved continuation is private-account data and clears on sign-out', () => {
  const storage = read('src/utils/storage.ts');

  assert.match(storage, /savedContinuation: 'sekretbip_saved_continuation_v1'/);
  assert.match(storage, /STORAGE_KEYS\.savedContinuation/);
  assert.match(storage, /AsyncStorage\.multiRemove\(\[\.\.\.PRIVATE_ACCOUNT_KEYS\]\)/);
});
