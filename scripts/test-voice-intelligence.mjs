import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outputDirectory = mkdtempSync(path.join(tmpdir(), 'voice-intelligence-'));
const require = createRequire(import.meta.url);

try {
  execFileSync(path.resolve('node_modules/.bin/tsc'), [
    'services/voiceBipIntelligence.ts',
    'services/oracleDiscovery.ts',
    '--outDir', outputDirectory,
    '--target', 'ES2020',
    '--module', 'commonjs',
    '--skipLibCheck',
  ], { stdio: 'inherit' });

  const intelligence = require(path.join(outputDirectory, 'services', 'voiceBipIntelligence.js'));
  const now = new Date('2026-06-12T20:00:00.000Z');
  const silent = intelligence.prepareVoiceBipIntelligence({
    voiceNoteId: 10,
    avatarKey: 'night',
    side: 'teen',
    transcriptText: null,
    now,
  });
  assert.equal(silent.transcript.status, 'unavailable');
  assert.equal(silent.transcript.provider, 'none');
  assert.equal(silent.oracleMemory, null, 'recording metadata must not become an inferred memory');
  assert.equal(silent.avatarResponse.visibleSpeaker, 'night');
  assert.ok(!JSON.stringify(silent.avatarResponse).includes('visibleSpeaker":"oracle'));

  const transcript = {
    ...silent.transcript,
    status: 'available',
    text: 'School pressure keeps showing up this week.',
  };
  const memory = intelligence.createOracleMemoryEntry(transcript, {
    text: 'School pressure may be repeating.',
    mood: 'stressed',
    oracle: {
      side: 'teen',
      kind: 'repeated-topic',
      confidence: 'emerging',
      topic: 'school pressure',
      evidence: [{ transcriptId: transcript.id, observedAt: transcript.capturedAt }],
      avatarKey: 'night',
    },
  });
  assert.equal(memory.source, 'oracle');
  assert.equal(memory.hidden, true);
  assert.equal(memory.locked, true);
  assert.deepEqual(intelligence.normalizeOracleJournalEntries([memory], 'teen'), [memory]);
  assert.deepEqual(intelligence.normalizeOracleJournalEntries([{ ...memory, hidden: false }], 'teen'), []);
  assert.deepEqual(intelligence.normalizeOracleJournalEntries([{ ...memory, oracle: { ...memory.oracle, side: 'parent' } }], 'teen'), []);

  console.log('Voice Bip intelligence audit passed.');
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
