#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const workerDir = path.join(repoRoot, 'worker');
if (!fs.existsSync(workerDir)) {
  console.log('No worker directory found; cloudflare review skipped.');
  process.exit(0);
}

const files = fs.readdirSync(workerDir).filter(f => /\.(ts|js)$/.test(f));
const violations = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(workerDir, file), 'utf8');
  if (content.includes('SUPABASE_SERVICE_ROLE_KEY=') || content.includes('OPENAI_API_KEY=')) {
    violations.push(`Hardcoded secret pattern in worker/${file}`);
  }
}

if (violations.length) {
  console.error('Cloudflare review failed:');
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log('Cloudflare review passed.');
