import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  detectPlaywrightAvailability,
  parsePlaywrightJson,
  writeReports,
} from '../scripts/control-room-verify-frontend.mjs';

test('Playwright JSON reporter counts are normalized for Control Room', () => {
  const counts = parsePlaywrightJson(JSON.stringify({
    stats: {
      expected: 8,
      unexpected: 1,
      flaky: 1,
      skipped: 2,
      timedOut: 1,
    },
  }));

  assert.deepEqual(counts, {
    passed: 8,
    failed: 2,
    skipped: 2,
    timedOut: 1,
    total: 13,
  });
});

test('forced fallback is explicit and never claims browser proof', async () => {
  const availability = await detectPlaywrightAvailability({
    rootDir: process.cwd(),
    env: { CONTROL_ROOM_FORCE_NO_PLAYWRIGHT: '1' },
  });

  assert.equal(availability.available, false);
  assert.match(availability.reason, /deterministic fallback testing/);
});

test('frontend reports distinguish browser evidence from local fallback', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bip-frontend-report-'));
  const availability = {
    available: false,
    reason: 'No Chromium binary in this test.',
    executablePath: null,
  };
  const run = {
    mode: 'fallback-verify-local',
    evidenceLevel: 'non-browser-fallback',
    browserProof: false,
    status: 'pass',
    exitCode: 0,
    durationMs: 12,
    counts: null,
    parseError: null,
    stdoutTail: 'local checks passed',
    stderrTail: '',
  };

  const { report, jsonPath, mdPath } = writeReports(availability, run, {
    outputDir,
    generatedAt: '2026-07-14T20:00:00.000Z',
  });

  assert.equal(report.run.browserProof, false);
  assert.equal(report.run.evidenceLevel, 'non-browser-fallback');
  assert.equal(JSON.parse(fs.readFileSync(jsonPath, 'utf8')).run.browserProof, false);

  const markdown = fs.readFileSync(mdPath, 'utf8');
  assert.match(markdown, /Browser proof: \*\*NO\*\*/);
  assert.match(markdown, /must not be described as browser or Playwright proof/);
});
