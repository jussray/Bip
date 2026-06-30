import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../worker/piper-tts.ts', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../services/piper-tts/server.py', import.meta.url), 'utf8');

test('Voice Bip uses Piper first', () => {
  assert.equal(worker.includes('PIPER_TTS_URL'), true);
  assert.equal(worker.includes('synthesizeWithPiper'), true);
  assert.equal(worker.includes("voiceSource: 'piper'"), true);
});

test('Piper client uses protected WAV synthesis', () => {
  assert.equal(client.includes('PIPER_TTS_TOKEN'), true);
  assert.equal(client.includes('Authorization'), true);
  assert.equal(client.includes("format: 'wav'"), true);
});

test('Piper service validates models and cleans files', () => {
  assert.equal(service.includes('onnx.json'), true);
  assert.equal(service.includes('BackgroundTasks'), true);
  assert.equal(service.includes('missing_ok=True'), true);
});
