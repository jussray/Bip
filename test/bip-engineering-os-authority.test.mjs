import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('GLOBAL_AI subordinates bip-os proposal to current authority', async () => {
  const global = await read('GLOBAL_AI.md');

  assert.match(global, /`bip-os\.md` status/);
  assert.match(global, /non-authoritative proposal and checklist reference/);
  assert.match(global, /Founder Control Room/);
  assert.match(global, /current repository paths/);
  assert.match(global, /do not authorize builds, deployment, credentials, paid capacity, publishing, or database application/);
});

test('Parent Bridge remains consented and minimized', async () => {
  const [global, status] = await Promise.all([
    read('GLOBAL_AI.md'),
    read('docs/BIP_ENGINEERING_OS_STATUS.md'),
  ]);

  assert.match(global, /Any statement suggesting parents can see everything a teen sees is invalid/);
  assert.match(status, /Bridge is a consented bridge, not a surveillance window/);
  assert.match(status, /generated summaries must be authorized by an active, unrevoked share/);
  assert.match(status, /Complete parent visibility \| Rejected/);
});

test('fictional monorepo and release YAML are explicitly non-claims', async () => {
  const status = await read('docs/BIP_ENGINEERING_OS_STATUS.md');

  assert.match(status, /not the proposed `apps\/mobile` \/ `packages\/\*` monorepo/);
  assert.match(status, /The YAML blocks in `bip-os\.md` are illustrative sketches only/);
  assert.match(status, /`supabase db push` is safe or authorized/);
  assert.match(status, /Production build\/deploy\/migrate chain \| Prohibited/);
});

test('actual repository path map keeps migration and runtime authority explicit', async () => {
  const status = await read('docs/BIP_ENGINEERING_OS_STATUS.md');

  for (const path of [
    '`app/`',
    '`src/`',
    '`supabase/migrations/`',
    '`supabase/probes/`',
    '`workers/`',
    '`test/`',
  ]) {
    assert.ok(status.includes(path), `missing current repository path ${path}`);
  }
  assert.match(status, /Database application must use reviewed ordered migrations and separate live approval/);
});

test('source material is preserved rather than deleted', async () => {
  const status = await read('docs/BIP_ENGINEERING_OS_STATUS.md');
  assert.match(status, /preserve `bip-os\.md` as source material/);
  assert.match(status, /do not execute it as instructions/);
});
