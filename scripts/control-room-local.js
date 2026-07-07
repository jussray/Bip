#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'control-room');
const jsonPath = path.join(reportDir, 'latest.json');
const mdPath = path.join(reportDir, 'latest.md');

const checks = [
  {
    id: 'runtime-assets',
    label: 'Runtime assets',
    command: 'npm',
    args: ['run', 'audit:runtime-assets'],
    area: 'app',
    required: true,
  },
  {
    id: 'control-room-structure',
    label: 'Control Room structure',
    command: 'npm',
    args: ['run', 'audit:control-room:structure'],
    area: 'control-room',
    required: true,
  },
  {
    id: 'control-room-rls',
    label: 'Supabase RLS scan',
    command: 'npm',
    args: ['run', 'audit:control-room:rls'],
    area: 'supabase',
    required: true,
  },
  {
    id: 'companions',
    label: 'Companion assets',
    command: 'npm',
    args: ['run', 'validate:companions'],
    area: 'companions',
    required: true,
  },
  {
    id: 'type-check',
    label: 'TypeScript',
    command: 'npm',
    args: ['run', 'type-check'],
    area: 'code-quality',
    required: true,
  },
  {
    id: 'lint',
    label: 'Lint',
    command: 'npm',
    args: ['run', 'lint'],
    area: 'code-quality',
    required: true,
  },
  {
    id: 'unit-tests',
    label: 'Unit tests',
    command: 'npm',
    args: ['test'],
    area: 'tests',
    required: true,
  },
  {
    id: 'voice-intelligence',
    label: 'Voice intelligence',
    command: 'npm',
    args: ['run', 'test:voice-intelligence'],
    area: 'voice',
    required: true,
  },
  {
    id: 'oracle',
    label: 'Oracle discovery',
    command: 'npm',
    args: ['run', 'test:oracle'],
    area: 'oracle',
    required: true,
  },
  {
    id: 'room-archives',
    label: 'Room archives',
    command: 'npm',
    args: ['run', 'verify:room-archives'],
    area: 'assets',
    required: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function runCheck(check) {
  const startedAt = Date.now();
  const result = spawnSync(check.command, check.args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CI: process.env.CI || 'false',
    },
  });

  const durationMs = Date.now() - startedAt;
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const exitCode = typeof result.status === 'number' ? result.status : 1;

  return {
    ...check,
    commandText: `${check.command} ${check.args.join(' ')}`,
    status: exitCode === 0 ? 'pass' : 'fail',
    exitCode,
    durationMs,
    stdoutTail: stdout.split('\n').slice(-40).join('\n').trim(),
    stderrTail: stderr.split('\n').slice(-40).join('\n').trim(),
  };
}

function summarize(results) {
  const passed = results.filter((check) => check.status === 'pass').length;
  const failed = results.filter((check) => check.status === 'fail').length;
  const requiredFailures = results.filter((check) => check.required && check.status === 'fail');
  const score = Math.round((passed / results.length) * 100);

  return {
    status: requiredFailures.length === 0 ? 'green' : 'red',
    pushSafe: requiredFailures.length === 0,
    demoReady: requiredFailures.length === 0 && score >= 90,
    score,
    passed,
    failed,
    total: results.length,
    requiredFailures: requiredFailures.map((check) => check.id),
  };
}

function writeReports(results, summary) {
  fs.mkdirSync(reportDir, { recursive: true });

  const report = {
    generatedAt: nowIso(),
    mode: 'local-control-room',
    purpose: 'Free local verification when GitHub Actions minutes are unavailable.',
    summary,
    checks: results,
    guardrails: [
      'No GitHub PAT is required or read by this script.',
      'No OpenAI key is required or read by this script.',
      'Do not run fixture audits on real teen private content.',
      'Use GitHub Actions only as a release/PR backup while minutes are constrained.',
    ],
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [];
  lines.push('# Bip Control Room — local report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Status: **${summary.status.toUpperCase()}**`);
  lines.push(`Score: **${summary.score}%**`);
  lines.push(`Push safe: **${summary.pushSafe ? 'yes' : 'no'}**`);
  lines.push(`Demo ready: **${summary.demoReady ? 'yes' : 'no'}**`);
  lines.push('');
  lines.push('| Area | Check | Status | Duration | Command |');
  lines.push('| --- | --- | --- | ---: | --- |');

  for (const check of results) {
    const icon = check.status === 'pass' ? '✅' : '❌';
    lines.push(`| ${check.area} | ${check.label} | ${icon} ${check.status} | ${check.durationMs}ms | \`${check.commandText}\` |`);
  }

  const failures = results.filter((check) => check.status === 'fail');
  if (failures.length) {
    lines.push('');
    lines.push('## Failures');
    for (const check of failures) {
      lines.push('');
      lines.push(`### ${check.label}`);
      lines.push('');
      lines.push(`Command: \`${check.commandText}\``);
      lines.push(`Exit code: \`${check.exitCode}\``);
      if (check.stderrTail) {
        lines.push('');
        lines.push('```text');
        lines.push(check.stderrTail);
        lines.push('```');
      }
      if (check.stdoutTail) {
        lines.push('');
        lines.push('```text');
        lines.push(check.stdoutTail);
        lines.push('```');
      }
    }
  }

  lines.push('');
  lines.push('## Guardrails');
  for (const guardrail of report.guardrails) {
    lines.push(`- ${guardrail}`);
  }

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);

  return report;
}

console.log('Bip Control Room: running local verification...');
console.log('GitHub Actions minutes are not required for this command.');

const results = [];
for (const check of checks) {
  process.stdout.write(`- ${check.label}... `);
  const result = runCheck(check);
  results.push(result);
  console.log(result.status === 'pass' ? 'pass' : 'fail');
}

const summary = summarize(results);
const report = writeReports(results, summary);

console.log('');
console.log(`Control Room status: ${summary.status.toUpperCase()}`);
console.log(`Score: ${summary.score}%`);
console.log(`Push safe: ${summary.pushSafe ? 'yes' : 'no'}`);
console.log(`Report: ${path.relative(root, jsonPath)}`);
console.log(`Readable report: ${path.relative(root, mdPath)}`);

process.exit(summary.pushSafe ? 0 : 1);
