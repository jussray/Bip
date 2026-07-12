import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const indexPath = new URL('../worker/index.ts', import.meta.url);
const observedPath = new URL('../worker/observed-index.ts', import.meta.url);
const modulePath = new URL('../worker/bridge-summary.ts', import.meta.url);

const indexSource = await readFile(indexPath, 'utf8');
const observedSource = await readFile(observedPath, 'utf8');
const moduleSource = await readFile(modulePath, 'utf8');

test('Worker exposes Bridge summary generation route behind API auth', () => {
  assert.match(indexSource, /api\/bridge\/summary\/generate/);
  assert.match(indexSource, /authenticate\(request, env\)/);
  assert.match(indexSource, /handleBridgeSummaryGenerate\(request, env, principal, cors\)/);
});

test('production Worker wrapper classifies Bridge summary telemetry', () => {
  assert.match(observedSource, /api\/bridge\/summary\/generate/);
  assert.match(observedSource, /bridge_summary_success/);
  assert.match(observedSource, /bridge_summary_fallback/);
});

test('Bridge summary route requires a user principal', () => {
  assert.match(moduleSource, /principal\.kind !== 'user'/);
  assert.match(moduleSource, /user_jwt_required/);
});

test('Bridge summary generation is scoped to the authenticated teen owner', () => {
  assert.match(moduleSource, /teen_user_id=eq\.\$\{encodeURIComponent\(userId\)\}/);
  assert.match(moduleSource, /fetchOwnedRequest\(env, requestId, userId\)/);
  assert.match(moduleSource, /request not found/);
  assert.match(moduleSource, /patchRequestStatus\(env, requestId, userId/);
});

test('revoked and expired requests cannot generate summaries', () => {
  assert.match(moduleSource, /row\.revoked_at/);
  assert.match(moduleSource, /revoked', 'expired', 'deleted/);
  assert.match(moduleSource, /status: 'revoked'/);
});

test('Bridge summary fallback stores only summary fields', () => {
  assert.match(moduleSource, /themes: FALLBACK_SUMMARY\.themes/);
  assert.match(moduleSource, /conversation_starters: FALLBACK_SUMMARY\.conversationStarters/);
  assert.match(moduleSource, /limitations: FALLBACK_SUMMARY\.limitations/);
});

test('Bridge summary generation reads source content only as ephemeral LLM input, never writes it back', () => {
  // Fetches minimized journal/mood content scoped to the requesting teen, to
  // summarize — this is the intentional content-aware generator, not a leak.
  assert.match(moduleSource, /journal_entries\?user_id=eq/);
  assert.match(moduleSource, /mood_history\?user_id=eq/);

  const upsertFallbackBody = moduleSource.slice(
    moduleSource.indexOf('async function upsertFallbackSummary'),
    moduleSource.indexOf('async function upsertGeneratedSummary'),
  );
  const upsertGeneratedBody = moduleSource.slice(
    moduleSource.indexOf('async function upsertGeneratedSummary'),
    moduleSource.indexOf('async function fetchShareSources'),
  );
  // Neither write path persists raw source snippets or row text — only the
  // model's generated themes/conversationStarters/limitations fields.
  assert.doesNotMatch(upsertFallbackBody, /snippets/);
  assert.doesNotMatch(upsertGeneratedBody, /snippets/);
  assert.doesNotMatch(upsertFallbackBody + upsertGeneratedBody, /row\.text/);
});

test('Bridge summary route does not expose notification or email delivery behavior', () => {
  assert.doesNotMatch(moduleSource, /send email/i);
  assert.doesNotMatch(moduleSource, /push notification/i);
  assert.doesNotMatch(moduleSource, /notification_deliveries/i);
});
