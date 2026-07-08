import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('fetchLinkStatus reads the real parent_links status contract and never invents a blocked state', async () => {
  const source = await read('src/utils/parentLink.ts');
  assert.match(source, /export type ParentLinkStatus = 'pending' \| 'active' \| 'revoked' \| 'expired' \| 'none';/);
  assert.match(source, /There is no 'blocked' status for parent_links/);
  assert.match(source, /export async function fetchLinkStatus/);
  assert.match(source, /\.or\(`teen_user_id\.eq\.\$\{uid\},parent_user_id\.eq\.\$\{uid\}`\)/);
});

test('fetchLinkStatus RLS: parent_links select policy allows either party to read any status row', async () => {
  const migration = await read('supabase/migrations/0004_supplemental_tables.sql');
  assert.match(migration, /create policy "parent_links_self" on public\.parent_links\s*\n\s*for select using \(auth\.uid\(\) = teen_user_id or auth\.uid\(\) = parent_user_id\)/);
});

test('revoke_parent_link RPC only ever writes pending/active/revoked, matching the client status union', async () => {
  const migration = await read('supabase/migrations/20260707022000_revoke_parent_link.sql');
  assert.match(migration, /status in \('pending', 'active'\)/);
  assert.match(migration, /status = 'revoked'/);
});

for (const [side, file] of [
  ['teen', 'app/(teen)/settings.tsx'],
  ['parent', 'app/(parent)/settings.tsx'],
]) {
  test(`${side} settings screen fetches and surfaces link status instead of a single static unlink button`, async () => {
    const source = await read(file);
    assert.match(source, /fetchLinkStatus/);
    assert.match(source, /useEffect\(\(\) => \{\s*void loadLinkStatus\(\);/);
  });

  test(`${side} settings screen distinguishes active, pending, revoked, expired, and none link states`, async () => {
    const source = await read(file);
    assert.match(source, /linkStatus === 'active'/);
    assert.match(source, /linkStatus === 'pending'/);
    assert.match(source, /linkStatus === 'revoked'/);
    assert.match(source, /linkStatus === 'expired'/);
    assert.match(source, /Not linked yet\./);
  });

  test(`${side} settings screen only shows the unlink control when a link is active or pending`, async () => {
    const source = await read(file);
    assert.match(source, /\{\(linkStatus === 'active' \|\| linkStatus === 'pending'\) && \(/);
  });

  test(`${side} settings screen has a distinct offline/retry state, separate from "not linked"`, async () => {
    const source = await read(file);
    assert.match(source, /linkStatusFailed/);
    assert.match(source, /Couldn't check your connection status/);
    assert.match(source, /onPress=\{loadLinkStatus\}/);
  });

  test(`${side} settings screen refreshes link status after unlink and after a successful redeem`, async () => {
    const source = await read(file);
    assert.match(source, /const revoked = await revokeParentLink\(\);[\s\S]*?await loadLinkStatus\(\);/);
    assert.match(source, /if \(result === 'ok'\) await loadLinkStatus\(\);/);
  });
}
