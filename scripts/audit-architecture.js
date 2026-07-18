#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const workerDir = path.join(repoRoot, 'worker');
const appDir = path.join(repoRoot, 'app');
const componentsDir = path.join(repoRoot, 'components');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const clientFiles = [...walk(appDir), ...walk(componentsDir)];
const violations = [];
for (const file of clientFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('createClient(') || content.includes("from '@supabase/supabase-js'")) {
    violations.push(`Direct Supabase client usage in ${path.relative(repoRoot, file)}`);
  }
}

const workerFiles = walk(workerDir);
for (const file of workerFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('try') || !content.includes('catch')) {
    violations.push(`Worker missing explicit try/catch: ${path.relative(repoRoot, file)}`);
  }
}

if (violations.length) {
  console.error('Architecture audit failed:');
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log('Architecture audit passed.');
