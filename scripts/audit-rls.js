#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.log('No supabase/migrations directory found; skipping RLS audit.');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
const violations = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8').toLowerCase();
  const creates = [...content.matchAll(/create table\s+(if not exists\s+)?([a-z0-9_\.\"]+)/g)];
  for (const match of creates) {
    const tableName = match[2].replaceAll('"', '');
    const rlsRegex = new RegExp(`alter table\\s+${tableName.replace('.', '\\.')}\\s+enable row level security`);
    if (!rlsRegex.test(content)) {
      violations.push(`${file}: missing RLS enable statement for ${tableName}`);
    }
  }
}

if (violations.length) {
  console.error('RLS audit failed:');
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log('RLS audit passed.');
