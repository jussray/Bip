import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../worker/piper-tts.ts', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../services/piper-tts/server.py', import.meta.url), 'utf8');

test('Voice Bip prefers Piper when configured', () => {
  assert.match(worker, /PIPER_TTS_URL/);
  assert.match(worker, /synthesizeWithPiper/);
  assert.match(worker, /voiceSource: 'piper'/);
});

test('Piper failure falls back to existing TTS when OpenAI is configured', () => {
  assert.match(worker, /if \(!env\.OPENAI_API_KEY\) return json\(\{ error: 'piper tts failed' \}, 502\)/);
  assert.match(worker, /return worker\.fetch/);
});

test('Piper client authenticates and requests WAV audio', () => {
  assert.match(client, /PIPER_TTS_TOKEN/);
  assert.match(client, /Authorization/);
  assert.match(client, /format: 'wav'/);
});

test('Piper service validates model files and deletes temporary audio', () => {
  assert.match(service, /onnx\.json/);
  assert.match(service, /BackgroundTasks/);
  assert.match(service, /missing_ok=True/);
});
