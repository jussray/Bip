import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { auditFailureTruth } from '../scripts/audit-failure-truth.mjs';
import { auditBranchHygiene } from '../scripts/audit-branch-hygiene.mjs';

function temporaryDirectory(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

test('failure truth flags a success state inside catch', () => {
  const root = temporaryDirectory('failure-truth-success');
  write(root, 'config/failure-truth-allowlist.json', '{"schemaVersion":1,"entries":[]}\n');
  write(root, 'src/reminder.ts', `
    export async function saveReminder() {
      try { await scheduleReminder(); }
      catch { setReminderSuccess(true); }
    }
  `);

  const findings = auditFailureTruth({ rootDir: root });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].classification, 'suspicious-success');
  assert.deepEqual(findings[0].suspiciousRules, ['success-flag-in-catch']);
});

test('failure truth accepts a truthful fallback Result path', () => {
  const root = temporaryDirectory('failure-truth-fallback');
  write(root, 'config/failure-truth-allowlist.json', '{"schemaVersion":1,"entries":[]}\n');
  write(root, 'src/reply.ts', `
    export async function reply() {
      try { return await sendReply(); }
      catch (error) {
        console.warn('reply failed', error);
        return fallbackReply();
      }
    }
  `);

  const findings = auditFailureTruth({ rootDir: root });
  assert.equal(findings.length, 1);
  assert.notEqual(findings[0].classification, 'suspicious-success');
  assert.ok(['truthful-fallback', 'telemetry-only'].includes(findings[0].classification));
});

test('allowlist entries require a concrete reason and marker', () => {
  const root = temporaryDirectory('failure-truth-allowlist');
  write(root, 'config/failure-truth-allowlist.json', '{"schemaVersion":1,"entries":[{"path":"src/a.ts"}]}\n');
  write(root, 'src/a.ts', 'try { run(); } catch { cleanup(); }\n');
  assert.throws(() => auditFailureTruth({ rootDir: root }), /requires path, contains, classification, and reason/);
});

test('branch hygiene classifies prohibited duplicate naming without deleting refs', () => {
  const root = temporaryDirectory('branch-hygiene');
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'user.name', 'Repository Truth Test');
  write(root, 'README.md', '# test\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-m', 'initial');
  const mainSha = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/main', mainSha);

  git(root, 'checkout', '-b', 'fix/reminder-v2');
  write(root, 'fix.txt', 'fix\n');
  git(root, 'add', 'fix.txt');
  git(root, 'commit', '-m', 'duplicate branch fixture');
  const branchSha = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/fix/reminder-v2', branchSha);

  const audit = auditBranchHygiene({ rootDir: root, staleDays: 30 });
  assert.equal(audit.headBranch, 'fix/reminder-v2');
  const branch = audit.branches.find((entry) => entry.name === 'fix/reminder-v2');
  assert.ok(branch);
  assert.equal(branch.prohibitedName, true);
  assert.equal(branch.classification, 'current-mission-branch');
  assert.equal(branch.deletionAuthorized, false);
  assert.equal(git(root, 'rev-parse', 'refs/remotes/origin/fix/reminder-v2'), branchSha);
});
