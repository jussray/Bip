import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.join(repoRoot, 'src', 'config', 'controlRoomVerificationRegistry.ts');
const lastRunPath = path.join(repoRoot, '.agents', 'verification-last-run.json');

const env = { ...process.env };
if (env.NODE_ENV !== 'ci') {
  if (env.SKIP_BUNDLE === undefined) env.SKIP_BUNDLE = '1';
  if (env.SKIP_E2E === undefined) env.SKIP_E2E = '1';
}

const registrySource = readFileSync(registryPath, 'utf8');
const registryMatch = registrySource.match(/CONTROL_ROOM_VERIFICATION_REGISTRY\s*=\s*(\[[\s\S]*?\])\s*as const;/);
if (!registryMatch) throw new Error('Could not parse Control Room verification registry');
const registry = JSON.parse(registryMatch[1]);
const checks = registry.filter((entry) => entry.key !== 'verify:release');
const now = new Date().toISOString();
const results = [];

function skipReason(entry) {
  const missing = (entry.skipEnv ?? []).filter((name) => !(name in env));
  if (missing.length) return `${missing.join(', ')} not set`;
  if (entry.skipFlag && env[entry.skipFlag] === '1') return `${entry.skipFlag}=1`;
  return '';
}

function icon(status) {
  if (status === 'Pass') return '🟢';
  if (status === 'Skip') return '🟡';
  return '🔴';
}

for (const entry of checks) {
  const started = Date.now();
  const reason = skipReason(entry);
  if (reason) {
    results.push({ ...entry, status: 'Skip', durationMs: 0, timestamp: now, log: `Skipped — ${reason}`, reason });
    continue;
  }

  const run = spawnSync(entry.command, {
    cwd: repoRoot,
    shell: true,
    env,
    encoding: 'utf8',
  });
  const log = `${run.stdout ?? ''}${run.stderr ?? ''}`.slice(0, 2000);
  results.push({
    ...entry,
    status: run.status === 0 ? 'Pass' : 'Fail',
    durationMs: Date.now() - started,
    timestamp: now,
    log,
  });
}

const failed = results.filter((result) => result.status === 'Fail');
const skipped = results.filter((result) => result.status === 'Skip');
const width = Math.max(...results.map((result) => result.label.length), 0) + 2;

console.log('══════════════════════════════════════');
console.log(' Control Room — Local Verification');
console.log('══════════════════════════════════════');
for (const result of results) {
  const label = result.label.padEnd(width, ' ');
  const detail = result.status === 'Skip' ? `(Skipped — ${result.reason})` : `${result.durationMs}ms`;
  console.log(` ${icon(result.status)}  ${label}${detail}`);
}
console.log('══════════════════════════════════════');
if (failed.length) {
  console.log(` ❌  ${failed.length} ${failed.length === 1 ? 'check' : 'checks'} failed — fix before pushing`);
} else {
  console.log(` ✅  All checks passed (${skipped.length} skipped)`);
}
console.log('══════════════════════════════════════');

if (failed.length) {
  for (const result of failed) {
    console.log(`\n${result.label} log:`);
    console.log(result.log || '(no output captured)');
  }
}

writeFileSync(lastRunPath, `${JSON.stringify({
  timestamp: now,
  results: results.map(({ key, label, status, durationMs, log }) => ({ key, label, status, durationMs, log })),
}, null, 2)}\n`);

process.exit(failed.length ? 1 : 0);
