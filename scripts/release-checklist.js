#!/usr/bin/env node
const { spawnSync } = require('child_process');

const checks = [
  ['node', ['scripts/audit-architecture.js']],
  ['node', ['scripts/audit-rls.js']],
  ['node', ['scripts/audit-companions.js']],
  ['node', ['scripts/audit-safety.js']]
];

for (const [cmd, args] of checks) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('Release checklist passed.');
