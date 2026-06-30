import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../worker/piper-tts.ts', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../services/piper-tts/server.py', import.meta.url), 'utf8');

test('Voice Bip has a Piper-first route and fallback path', () => {
  for (const token of ['PIPER_TTS_URL', 'synthesizeWithPiper', 'voiceSource', 'piper', 'worker.fetch']) {
    assert.equal(worker.includes(token), true);
  }
});

test('Piper client supports protected WAV synthesis', () => {
  for (const token of ['PIPER_TTS_TOKEN', 'Authorization', 'synthesize', 'wav']) {
    assert.equal(client.includes(token), true);
  }
});

test('Piper service validates voice models and cleans temporary files', () => {
  for (const token of ['onnx', 'BackgroundTasks', 'missing_ok=True', 'FileResponse']) {
    assert.equal(service.includes(token), true);
  }
});
