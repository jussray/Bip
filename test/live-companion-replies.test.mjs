import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../src/utils/api.ts', import.meta.url), 'utf8');
const pages = fs.readFileSync(new URL('../src/utils/sekretReply.ts', import.meta.url), 'utf8');
const engine = fs.readFileSync(new URL('../src/features/sekret/companionEngine.ts', import.meta.url), 'utf8');

test('short arrival messages are sent to the Worker instead of returned locally', () => {
  assert.equal(pages.includes('isArrivalMessage'), false);
  assert.equal(pages.includes('getArrivalReply'), false);
  assert.equal(pages.includes('fetchSekretBrainReply({'), true);
  assert.equal(pages.includes('userText: input.text'), true);
});

test('valid Worker replies stay live and are not replaced by a local reply guard', () => {
  assert.equal(pages.includes('keepSekretReply'), false);
  assert.equal(pages.includes('reply: response.reply'), true);
  assert.equal(api.includes("replySource: 'openai'"), true);
  assert.equal(api.includes('fallbackUsed: false'), true);
});

test('fallbacks are restricted to explicit backend failure reasons', () => {
  for (const reason of ['missing_backend_url', 'invalid_json', 'empty_reply', 'network_error']) {
    assert.equal(api.includes(reason), true, `missing fallback reason: ${reason}`);
  }
  assert.equal(api.includes('`http_${res.status}`'), true);
});

test('companion identity, message, surface, mood, history, and memory reach the shared pipeline', () => {
  for (const contract of [
    'characterId: normalizeSekretCharacter(input.companionId)',
    'surface: toBackendSurface(input.surface)',
    'userText: input.text',
    'mood: input.mood',
    'history: input.history',
    'memory: Object.keys(memory).length > 0 ? memory : undefined',
  ]) {
    assert.equal(engine.includes(contract), true, `missing request contract: ${contract}`);
  }
});

test('Pages and companion chat expose live versus fallback metadata', () => {
  for (const source of [pages, engine]) {
    assert.equal(source.includes('replySource'), true);
    assert.equal(source.includes('fallbackUsed'), true);
    assert.equal(source.includes('fallbackReason'), true);
  }
});
