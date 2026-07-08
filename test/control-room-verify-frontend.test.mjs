import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  detectPlaywrightAvailability,
  parsePlaywrightJson,
  writeReports,
} from '../scripts/control-room-verify-frontend.mjs';

const source = fs.readFileSync(new URL('../scripts/control-room-verify-frontend.mjs', import.meta.url), 'utf8');
const agent = fs.readFileSync(new URL('../scripts/control-room-agent.mjs', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../src/config/controlRoomOs.ts', import.meta.url), 'utf8');
const gitignore = fs.readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');

test('verify-frontend is registered as an allowlisted mission with no arbitrary passthrough', () => {
  assert.match(agent, /'verify-frontend'/);
  assert.match(agent, /control-room-verify-frontend\.mjs/);
  assert.match(agent, /Allowed missions only/);
  assert.doesNotMatch(agent, /process\.argv\.slice\(2\).*spawnSync/s);
});

test('script only ever runs the two allowlisted commands, never arbitrary input', () => {
  assert.match(source, /spawnSync\('npx', \['playwright', 'test', '--reporter=json'\]/);
  assert.match(source, /spawnSync\('npm', \['run', 'verify:local'\]/);
  assert.doesNotMatch(source, /process\.argv\[2\]/);
});

test('playwright/browser-test capability is registered in connector and worker registries', () => {
  assert.match(config, /id: 'playwright'/);
  assert.match(config, /capabilities: \['browser-test'\]/);
  assert.match(config, /capabilities: \['launch-bip', 'verify-local', 'tests', 'build', 'browser-test'\]/);
  assert.match(config, /id: 'verify-frontend'/);
});

test('detectPlaywrightAvailability degrades gracefully when forced unavailable', () => {
  const prev = process.env.CONTROL_ROOM_FORCE_NO_PLAYWRIGHT;
  process.env.CONTROL_ROOM_FORCE_NO_PLAYWRIGHT = '1';
  try {
    const result = detectPlaywrightAvailability();
    assert.equal(result.available, false);
    assert.match(result.reason, /CONTROL_ROOM_FORCE_NO_PLAYWRIGHT/);
  } finally {
    if (prev === undefined) delete process.env.CONTROL_ROOM_FORCE_NO_PLAYWRIGHT;
    else process.env.CONTROL_ROOM_FORCE_NO_PLAYWRIGHT = prev;
  }
});

test('parsePlaywrightJson reads pass/fail/skip counts from Playwright JSON reporter output', () => {
  const stdout = JSON.stringify({ stats: { expected: 4, unexpected: 1, skipped: 2, flaky: 0, timedOut: 0 } });
  const counts = parsePlaywrightJson(stdout);
  assert.deepEqual(counts, { passed: 4, failed: 1, skipped: 2, timedOut: 0, total: 7 });
});

test('parsePlaywrightJson throws on malformed input so callers can record a parse error', () => {
  assert.throws(() => parsePlaywrightJson('not json'));
});

test('writeReports produces machine-readable JSON and a readable Markdown summary noting fallback', () => {
  const availability = { available: false, reason: 'No Chromium browser binary was found for Playwright.' };
  const run = {
    mode: 'fallback-verify-local',
    status: 'pass',
    exitCode: 0,
    durationMs: 1234,
    counts: null,
    stdoutTail: '',
    stderrTail: '',
  };

  const report = writeReports(availability, run);
  assert.equal(report.run.mode, 'fallback-verify-local');

  const root = path.resolve(path.dirname(fileURLToPath(new URL('../scripts/control-room-verify-frontend.mjs', import.meta.url))), '..');
  const jsonPath = path.join(root, 'reports', 'control-room', 'frontend.json');
  const mdPath = path.join(root, 'reports', 'control-room', 'frontend.md');

  const persisted = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(persisted.run.status, 'pass');
  assert.equal(persisted.playwright.available, false);

  const markdown = fs.readFileSync(mdPath, 'utf8');
  assert.match(markdown, /Playwright unavailable/);
  assert.match(markdown, /npm run verify:local/);
});

test('generated Control Room reports stay out of git', () => {
  assert.match(gitignore, /reports\/control-room\//);
});
