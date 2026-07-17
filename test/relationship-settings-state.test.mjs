import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const helper = fs.readFileSync(new URL('../src/utils/parentLink.ts', import.meta.url), 'utf8');
const card = fs.readFileSync(new URL('../src/components/settings/RelationshipLinkStatusCard.tsx', import.meta.url), 'utf8');
const teenSettings = fs.readFileSync(new URL('../app/(teen)/settings.tsx', import.meta.url), 'utf8');
const parentSettings = fs.readFileSync(new URL('../app/(parent)/settings.tsx', import.meta.url), 'utf8');

function functionBody(source, name, nextName) {
  const start = source.indexOf(`export async function ${name}`);
  const end = nextName ? source.indexOf(`export async function ${nextName}`, start + 1) : source.length;
  assert.notEqual(start, -1, `${name} is missing`);
  return source.slice(start, end === -1 ? source.length : end);
}

test('relationship status reads are side-scoped, minimized, and retain every readable parent row', () => {
  const body = functionBody(helper, 'fetchParentLinkStatuses', 'fetchLinkedTeenId');
  assert.match(body, /select\('id,status,is_active,updated_at,expires_at'\)/);
  assert.match(body, /accountSide === 'teen'/);
  assert.match(body, /eq\('teen_user_id', userResult\.value\)/);
  assert.match(body, /eq\('parent_user_id', userResult\.value\)/);
  assert.doesNotMatch(body, /select\([^)]*teen_user_id/);
  assert.doesNotMatch(body, /select\([^)]*parent_user_id/);
  assert.doesNotMatch(body, /\.limit\(1\)/);
});

test('only migration-defined relationship states are accepted and malformed rows fail closed', () => {
  assert.match(helper, /new Set<ParentLinkStatus>\(\['pending', 'active', 'revoked', 'expired'\]\)/);
  assert.doesNotMatch(helper, /ParentLinkStatus[^\n]*blocked/);
  assert.match(helper, /PARENT_LINK_STATUSES\.has/);
  assert.match(helper, /code: 'invalid_response'.*Retry before making changes/s);
});

test('unlink targets the exact selected relationship and preserves the old boolean wrapper', () => {
  const body = functionBody(helper, 'revokeParentLinkResult', 'revokeParentLink');
  assert.match(body, /rpc\('revoke_parent_link', \{ p_link_id: linkId \}\)/);
  assert.match(body, /typeof data !== 'boolean'/);
  assert.match(body, /return \{ ok: true, value: data \}/);
  assert.match(helper, /export async function revokeParentLink\(linkId\?: string\): Promise<boolean>/);
  assert.match(helper, /return result\.ok && result\.value/);
});

test('the shared card separates loading, no-link, offline retry, and recorded states', () => {
  for (const state of ['loading', 'error', 'ready']) {
    assert.match(card, new RegExp(`kind: '${state}'`));
  }
  for (const status of ['active', 'pending', 'revoked', 'expired']) {
    assert.match(card, new RegExp(`link\\.status === '${status}'`));
  }
  assert.match(card, /Retry status/);
  assert.match(card, /links\.length === 0/);
  assert.match(card, /link\.canRevoke/);
});

test('offline revocation never guesses among a parent account’s possible teen rows', () => {
  assert.match(card, /accountSide === 'teen'/);
  assert.match(card, /one canonical parent-link row/);
  assert.match(card, /accountSide === 'parent'/);
  assert.match(card, /does not guess which teen relationship you meant/);
  assert.match(card, /confirmUnlink\(link\.linkId\)/);
});

test('both settings screens use the shared state machine and refresh after relationship changes', () => {
  assert.match(teenSettings, /RelationshipLinkStatusCard[\s\S]*accountSide="teen"/);
  assert.match(parentSettings, /RelationshipLinkStatusCard[\s\S]*accountSide="parent"/);
  for (const source of [teenSettings, parentSettings]) {
    assert.match(source, /setLinkStatusVersion\(\(value\) => value \+ 1\)/);
    assert.doesNotMatch(source, /revokeParentLink\(\)/);
    assert.doesNotMatch(source, /No active link was found, or the connection could not be updated/);
  }
});
