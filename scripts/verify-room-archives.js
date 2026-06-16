'use strict';

const { createHash } = require('node:crypto');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const liveDir = path.join(root, 'assets', 'images');
const archiveDir = path.join(liveDir, 'archive');
const MIN_ARCHIVE_BYTES = 1024 * 1024;

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

const liveFiles = readdirSync(liveDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^bg-.*\.png$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const failures = [];

for (const name of liveFiles) {
  const livePath = path.join(liveDir, name);
  const archivePath = path.join(archiveDir, name);

  let archiveStat;
  try {
    archiveStat = statSync(archivePath);
  } catch {
    failures.push(`${name}: missing archive copy at assets/images/archive/${name}`);
    continue;
  }

  if (!archiveStat.isFile()) {
    failures.push(`${name}: archive path is not a file`);
    continue;
  }

  if (archiveStat.size < MIN_ARCHIVE_BYTES) {
    failures.push(`${name}: archive copy is only ${archiveStat.size} bytes (must be >= ${MIN_ARCHIVE_BYTES} bytes)`);
    continue;
  }

  const liveHash = sha256(livePath);
  const archiveHash = sha256(archivePath);
  if (liveHash !== archiveHash) {
    failures.push(`${name}: live and archive hashes do not match (live ${liveHash.slice(0, 12)}…, archive ${archiveHash.slice(0, 12)}…)`);
  }
}

if (failures.length > 0) {
  console.error('Room archive verification failed:\n');
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  console.error('\nDO NOT START PHASE 2');
  process.exit(1);
}

console.log(`Room archive verification passed for ${liveFiles.length} room background(s).`);
