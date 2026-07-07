import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const testRoot = path.join(root, 'test');

function collectTests(directory) {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

const tests = collectTests(testRoot);

if (tests.length === 0) {
  console.warn('CONTROL_ROOM_NO_TESTS: No .test.mjs files were found under test/.');
  process.exit(2);
}

console.log(`Discovered ${tests.length} unit test files.`);

const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(typeof result.status === 'number' ? result.status : 1);
