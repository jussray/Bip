import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const indexPath = new URL('../worker/index.ts', import.meta.url);
const modulePath = new URL('../worker/bridge-summary.ts', import.meta.url);

const indexSource = await readFile(indexPath, 'utf8');
const moduleSource = await readFile(modulePath, 'utf8');

test('Worker exposes Bridge summary generation route behind API auth', () => {
  assert.match(indexSource, /api\/bridge\/summary\/generate/);
  assert.match(indexSource, /authenticate\(request, env\)/);
  assert.match(indexSource, /handleBridgeSummaryGenerate\(request, env, principal, cors\)/);
});

test('Bridge summary route requires a user principal', () => {
  assert.match(moduleSource, /principal\.kind !== 'user'/);
  assert.match(moduleSource, /user_jwt_required/);
});

test('Bridge summary fallback stores only summary fields', () => {
  assert.match(moduleSource, /themes: FALLBACK_SUMMARY\.themes/);
  assert.match(moduleSource, /conversation_starters: FALLBACK_SUMMARY\.conversationStarters/);
  assert.match(moduleSource, /limitations: FALLBACK_SUMMARY\.limitations/);
  assert.doesNotMatch(moduleSource, /journal_entries\?/);
  assert.doesNotMatch(moduleSource, /mood_history\?/);
});

test('Bridge summary route does not expose notification or email behavior', () => {
  assert.doesNotMatch(moduleSource, /email/i);
  assert.doesNotMatch(moduleSource, /push/i);
  assert.doesNotMatch(moduleSource, /notification/i);
});
