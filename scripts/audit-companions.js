#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const repliesPath = path.join(repoRoot, 'worker', 'companion-replies.ts');
const docsDir = path.join(repoRoot, 'docs', 'companions');

if (!fs.existsSync(repliesPath)) {
  console.log('No worker/companion-replies.ts found; skipping companion audit.');
  process.exit(0);
}

const content = fs.readFileSync(repliesPath, 'utf8');
const requiredDocs = ['raylene','rylane','cloud','night','sekret','parent-coach'];
const missingDocs = requiredDocs.filter(name => !fs.existsSync(path.join(docsDir, `${name}.md`)));
if (missingDocs.length) {
  console.error(`Missing companion docs: ${missingDocs.join(', ')}`);
  process.exit(1);
}

const requiredPools = ['raylene', 'rylane', 'cloud', 'night', 'sekret', 'parentCoach'];
const missingPools = requiredPools.filter(pool => !content.includes(`${pool}: [`));
if (missingPools.length) {
  console.error(`Missing companion reply pools: ${missingPools.join(', ')}`);
  process.exit(1);
}

const bannedTerms = ['kill yourself', 'suicide plan', 'self-harm instructions'];
const foundBanned = bannedTerms.filter(term => content.toLowerCase().includes(term));
if (foundBanned.length) {
  console.error(`Companion replies contain banned crisis-adjacent phrases: ${foundBanned.join(', ')}`);
  process.exit(1);
}

console.log('Companion audit passed.');
