#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const safetyPath = path.join(repoRoot, 'worker', 'safety-check.ts');

if (!fs.existsSync(safetyPath)) {
  console.log('No worker/safety-check.ts found; safety audit skipped.');
  process.exit(0);
}

const content = fs.readFileSync(safetyPath, 'utf8').toLowerCase();
const requiredSignals = ['escalat', 'crisis', 'safe'];
const missing = requiredSignals.filter(signal => !content.includes(signal));

if (missing.length) {
  console.error(`Safety audit failed. Missing signals: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Safety audit passed.');
