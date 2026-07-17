import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent coach receives a parent-safe local fallback on every failure path', async () => {
  const chat = await read('src/services/ai/chat.ts');

  assert.match(chat, /if \(personalityId === 'parentCoach'\) \{/);
  assert.match(chat, /Start with what happened at home and what you want to handle differently\./);
  assert.doesNotMatch(
    chat.match(/if \(personalityId === 'parentCoach'\) \{[\s\S]*?\n  \}/)?.[0] ?? '',
    /girl|aight|gang|what REALLY happened/i,
  );
});

test('parent coach dashes are preserved without bypassing the rest of the reply guard', async () => {
  const chat = await read('src/services/ai/chat.ts');

  assert.match(chat, /const isParentCoach = personalityId === 'parentCoach'/);
  assert.match(chat, /rawReply\.replace\(\/\[—–\]\/g, '-'\)\.replace\(\/ -- \/g, ' - '\)/);
  assert.match(chat, /const guardedCandidate = keepSekretReply\(guardInput, sekretFallback\)/);
  assert.match(chat, /const guardBlocked = guardedCandidate !== guardInput\.trim\(\)/);
  assert.match(chat, /isParentCoach && !guardBlocked\s*\? rawReply\.trim\(\)\s*:\s*guardedCandidate/);
  assert.match(chat, /If any other blocked language is present, the parent-safe fallback still wins/);
});

test('teen companion surfaces still use the original strict guard input', async () => {
  const chat = await read('src/services/ai/chat.ts');

  assert.match(chat, /const guardInput = isParentCoach[\s\S]*:\s*rawReply;/);
  assert.match(chat, /getSekretFallback\(personalityId, text\)/);
});
