import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const migrationPath = 'supabase/migrations/20260718034500_controlled_alpha_relationship_boundaries.sql';

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

test('Bridge server accepts only owned Journal and Mood sources through the RPC', async () => {
  const migration = await read(migrationPath);

  assert.match(migration, /drop policy if exists bridge_share_requests_teen_insert/);
  assert.match(migration, /drop policy if exists bridge_share_requests_teen_update/);
  assert.match(migration, /drop policy if exists bridge_share_sources_teen_insert/);
  assert.match(migration, /v_source_kind not in \('journal', 'mood'\)/);
  assert.match(migration, /from public\.journal_entries entry[\s\S]*entry\.user_id = v_teen_user_id/);
  assert.match(migration, /from public\.mood_history mood[\s\S]*mood\.user_id = v_teen_user_id/);
  assert.match(migration, /unsupported_or_invalid_source/);
  assert.match(migration, /source_not_available/);
  assert.match(migration, /Direct request\/source mutation policies are intentionally absent/);
});

test('Crew revocation uses a scoped RPC and treats a null result as no transition', async () => {
  const service = await read('src/services/crewAccountabilityServiceV2.ts');
  const start = service.indexOf('export async function revokeCheckInShare');
  const end = service.indexOf('export async function fetchMyCheckIns');
  const revoke = service.slice(start, end);

  assert.match(revoke, /rpc\('revoke_crew_check_in_share'/);
  assert.match(revoke, /p_check_in_id: checkInId/);
  assert.match(revoke, /p_shared_with: sharedWithUserId/);
  assert.match(revoke, /typeof data !== 'string' \|\| !data/);
  assert.match(revoke, /No active Crew share matched/);
  assert.doesNotMatch(revoke, /from\('crew_check_in_shares'\)/);
  assert.ok(
    revoke.indexOf("return { ok: true, value: { revoked: true } }") > revoke.indexOf("typeof data !== 'string' || !data"),
    'success must occur only after the RPC result guard',
  );
});

test('Crew share mutations are RPC-only and every share owner matches the check-in owner', async () => {
  const migration = await read(migrationPath);

  assert.match(migration, /drop policy if exists crew_check_in_shares_owner_insert/);
  assert.match(migration, /drop policy if exists crew_check_in_shares_owner_update/);
  assert.match(migration, /create trigger crew_check_in_shares_owner_guard/);
  assert.match(migration, /v_check_in_owner <> new\.owner_user_id/);
  assert.match(migration, /create or replace function public\.revoke_crew_check_in_share/);
  assert.match(migration, /and status = 'active'[\s\S]*returning id into v_share_id/);
  assert.match(migration, /s\.owner_user_id = crew_check_ins\.owner_user_id/);
  assert.match(migration, /ci\.owner_user_id = crew_check_in_shares\.owner_user_id/);
  assert.match(migration, /ci\.owner_user_id = s\.owner_user_id/);
});
