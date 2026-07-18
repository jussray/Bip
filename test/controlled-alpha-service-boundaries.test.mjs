import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('controlled-alpha relationship features stop at the beta audience', async () => {
  const flags = await read('src/constants/relationshipFeatureFlags.ts');

  assert.match(flags, /bridgeSummaries:\s*'beta'/);
  assert.match(flags, /crewAccountability:\s*'beta'/);
  assert.match(flags, /state === 'beta'[\s\S]*audience === 'beta'/);
  assert.doesNotMatch(flags, /bridgeSummaries:\s*'enabled'/);
  assert.doesNotMatch(flags, /crewAccountability:\s*'enabled'/);
});

test('controlled-alpha Worker configuration fails closed until a cohort allowlist is provisioned', async () => {
  const alpha = await read('wrangler.alpha.toml');
  const production = await read('wrangler.toml');

  assert.match(alpha, /name\s*=\s*"sekret-backend-alpha"/);
  assert.match(alpha, /comma-separated allowlist/);
  assert.match(alpha, /BRIDGE_SUMMARIES_ROLLOUT\s*=\s*"disabled"/);
  assert.doesNotMatch(alpha, /BRIDGE_SUMMARIES_ROLLOUT\s*=\s*"enabled"/);
  assert.match(production, /BRIDGE_SUMMARIES_ROLLOUT\s*=\s*"disabled"/);
});

test('Bridge rejects unsupported sources before creating a database request', async () => {
  const service = await read('src/services/bridgeSummaryService.ts');
  const guardIndex = service.indexOf('sources.some((source) => !CONTROLLED_ALPHA_SOURCE_KINDS.has(source.kind))');
  const rpcIndex = service.indexOf("sb.rpc('create_bridge_share_request'");

  assert.match(service, /CONTROLLED_ALPHA_SOURCE_KINDS[\s\S]*'journal'[\s\S]*'mood'/);
  assert.match(service, /Controlled alpha currently supports Journal entries and Mood check-ins only/);
  assert.ok(guardIndex >= 0, 'Bridge source guard must exist');
  assert.ok(rpcIndex >= 0, 'Bridge request RPC must exist');
  assert.ok(guardIndex < rpcIndex, 'unsupported source guard must run before the request RPC');
});

test('Crew revocation requires one observed active-row transition', async () => {
  const service = await read('src/services/crewAccountabilityServiceV2.ts');
  const start = service.indexOf('export async function revokeCheckInShare');
  const end = service.indexOf('export async function fetchMyCheckIns');
  const revoke = service.slice(start, end);

  assert.match(revoke, /\.eq\('status', 'active'\)/);
  assert.match(revoke, /\.select\('id,status,revoked_at'\)/);
  assert.match(revoke, /\.maybeSingle\(\)/);
  assert.match(revoke, /!data \|\| data\.status !== 'revoked'/);
  assert.match(revoke, /typeof data\.revoked_at !== 'string'/);
  assert.match(revoke, /No active Crew share matched/);
  assert.ok(
    revoke.indexOf("return { ok: true, value: { revoked: true } }") > revoke.indexOf("data.status !== 'revoked'"),
    'success must occur only after the observed-row guard',
  );
});
