import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../worker/piper-tts.ts', import.meta.url), 'utf8');
const contract = fs.readFileSync(new URL('../src/contracts/sekretApi.ts', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../services/piper-tts/server.py', import.meta.url), 'utf8');
const dockerfile = fs.readFileSync(new URL('../services/piper-tts/Dockerfile', import.meta.url), 'utf8');
const requirements = fs.readFileSync(new URL('../services/piper-tts/requirements.txt', import.meta.url), 'utf8');

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

test('Piper alignment lane is additive and fails soft to the stable WAV route', () => {
  for (const token of ['synthesize-aligned', 'alignmentsAvailable', 'PiperPhonemeAlignment', 'response.status === 404 || response.status === 405']) {
    assert.equal(client.includes(token), true);
  }
  for (const token of ['@app.post("/synthesize")', '@app.post("/synthesize-aligned")', 'include_alignments=True', 'startSeconds', 'durationSeconds']) {
    assert.equal(service.includes(token), true);
  }
});

test('Piper phoneme timing reaches the public Voice Bip contract', () => {
  assert.equal(worker.includes('phonemeTiming: audio.alignmentsAvailable ? audio.alignments : undefined'), true);
  for (const token of ['PiperPhonemeAlignment', 'phonemeTiming?: PiperPhonemeAlignment[]']) {
    assert.equal(contract.includes(token), true);
  }
});

test('Piper voice models are patched at image build time for timing output', () => {
  assert.equal(requirements.includes('piper-tts[alignment]==1.4.2'), true);
  assert.equal(dockerfile.includes('python -m piper.patch_voice_with_alignment'), true);
  assert.equal(dockerfile.includes('for model in /voices/*.onnx'), true);
});

test('canonical Piper defaults match the voice models baked into the image', () => {
  const expected = [
    ['suhana', 'en_US-amy-medium'],
    ['sy', 'en_US-ryan-medium'],
    ['cloud', 'en_US-amy-low'],
    ['night', 'en_US-lessac-low'],
    ['sekret', 'en_US-amy-medium'],
    ['parentCoach', 'en_US-amy-medium'],
  ];

  for (const [characterId, modelStem] of expected) {
    assert.equal(client.includes(`${characterId}: '${modelStem}'`), true);
    assert.equal(dockerfile.includes(`/voices/${modelStem}.onnx`), true);
    assert.equal(dockerfile.includes(`/voices/${modelStem}.onnx.json`), true);
  }
});

test('Piper deployment documentation uses current canonical names', () => {
  assert.equal(dockerfile.includes('Raylene'), false);
  assert.equal(dockerfile.includes('Rylane'), false);
  for (const name of ['Suhana', 'Sy', 'Cloud', 'Night']) assert.equal(dockerfile.includes(name), true);
});

test('Piper service validates voice models and cleans temporary files', () => {
  for (const token of ['onnx', 'BackgroundTasks', 'missing_ok=True', 'FileResponse']) {
    assert.equal(service.includes(token), true);
  }
});
