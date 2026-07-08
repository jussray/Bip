#!/usr/bin/env node
// Control Room "Verify Frontend" mission: runs the Playwright smoke suite when
// Playwright and a browser binary are available, otherwise falls back to the
// existing non-browser local verification suite. Never shells out to arbitrary
// commands — only the two allowlisted paths below can run.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDir = path.join(root, 'reports', 'control-room');
const jsonPath = path.join(reportDir, 'frontend.json');
const mdPath = path.join(reportDir, 'frontend.md');

function nowIso() {
  return new Date().toISOString();
}

export function detectPlaywrightAvailability() {
  if (process.env.CONTROL_ROOM_FORCE_NO_PLAYWRIGHT === '1') {
    return { available: false, reason: 'Disabled via CONTROL_ROOM_FORCE_NO_PLAYWRIGHT for testing/CI.' };
  }
  let hasPackage = false;
  try {
    hasPackage = fs.existsSync(path.join(root, 'node_modules', '@playwright', 'test'));
  } catch {
    hasPackage = false;
  }
  if (!hasPackage) {
    return { available: false, reason: '@playwright/test is not installed in node_modules.' };
  }

  const sandboxChromium = '/opt/pw-browsers/chromium';
  const hasBrowser =
    Boolean(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) || fs.existsSync(sandboxChromium);
  if (!hasBrowser) {
    return { available: false, reason: 'No Chromium browser binary was found for Playwright.' };
  }

  return { available: true, reason: null };
}

export function parsePlaywrightJson(stdout) {
  const parsed = JSON.parse(stdout || '{}');
  const stats = parsed.stats || {};
  return {
    passed: stats.expected ?? 0,
    failed: (stats.unexpected ?? 0) + (stats.flaky ?? 0),
    skipped: stats.skipped ?? 0,
    timedOut: stats.timedOut ?? 0,
    total: (stats.expected ?? 0) + (stats.unexpected ?? 0) + (stats.skipped ?? 0) + (stats.flaky ?? 0),
  };
}

function runPlaywright() {
  const startedAt = Date.now();
  const result = spawnSync('npx', ['playwright', 'test', '--reporter=json'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, CI: process.env.CI || 'false' },
  });
  const durationMs = Date.now() - startedAt;
  const exitCode = typeof result.status === 'number' ? result.status : 1;

  let counts = { passed: 0, failed: 0, skipped: 0, timedOut: 0, total: 0 };
  let parseError = null;
  try {
    counts = parsePlaywrightJson(result.stdout);
  } catch (error) {
    parseError = error.message;
  }

  return {
    mode: 'playwright',
    status: exitCode === 0 ? 'pass' : 'fail',
    exitCode,
    durationMs,
    counts,
    parseError,
    stdoutTail: (result.stdout || '').split('\n').slice(-40).join('\n').trim(),
    stderrTail: (result.stderr || '').split('\n').slice(-40).join('\n').trim(),
  };
}

function runFallback() {
  const startedAt = Date.now();
  const result = spawnSync('npm', ['run', 'verify:local'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, CI: process.env.CI || 'false' },
  });
  const durationMs = Date.now() - startedAt;
  const exitCode = typeof result.status === 'number' ? result.status : 1;

  return {
    mode: 'fallback-verify-local',
    status: exitCode === 0 ? 'pass' : 'fail',
    exitCode,
    durationMs,
    counts: null,
    parseError: null,
    stdoutTail: (result.stdout || '').split('\n').slice(-40).join('\n').trim(),
    stderrTail: (result.stderr || '').split('\n').slice(-40).join('\n').trim(),
  };
}

export function writeReports(availability, run) {
  fs.mkdirSync(reportDir, { recursive: true });

  const report = {
    generatedAt: nowIso(),
    mission: 'verify-frontend',
    purpose: 'Control Room frontend verification: Playwright when available, non-browser fallback otherwise.',
    playwright: availability,
    run,
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [];
  lines.push('# Bip Control Room — Verify Frontend mission');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Mode: **${run.mode}**`);
  lines.push(`Status: **${run.status.toUpperCase()}**`);
  lines.push(`Duration: ${run.durationMs}ms`);
  if (!availability.available) {
    lines.push('');
    lines.push(`Playwright unavailable: ${availability.reason}`);
    lines.push('Fell back to `npm run verify:local` (non-browser local verification).');
  }
  if (run.counts) {
    lines.push('');
    lines.push(`Passed: ${run.counts.passed} · Failed: ${run.counts.failed} · Skipped: ${run.counts.skipped} · Timed out: ${run.counts.timedOut}`);
  }
  if (run.status === 'fail') {
    lines.push('');
    lines.push('## Failure output');
    if (run.stderrTail) {
      lines.push('');
      lines.push('```text');
      lines.push(run.stderrTail);
      lines.push('```');
    }
    if (run.stdoutTail) {
      lines.push('');
      lines.push('```text');
      lines.push(run.stdoutTail);
      lines.push('```');
    }
  }

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
  return report;
}

function main() {
  console.log('Control Room: Verify Frontend mission starting...');
  const availability = detectPlaywrightAvailability();

  let run;
  if (availability.available) {
    console.log('Playwright available. Running e2e smoke suite...');
    run = runPlaywright();
  } else {
    console.log(`Playwright unavailable (${availability.reason}). Falling back to npm run verify:local.`);
    run = runFallback();
  }

  const report = writeReports(availability, run);
  console.log(`Mode: ${report.run.mode}`);
  console.log(`Status: ${report.run.status.toUpperCase()}`);
  console.log(`Report: ${path.relative(root, jsonPath)}`);
  console.log(`Readable report: ${path.relative(root, mdPath)}`);

  process.exit(report.run.status === 'pass' ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
