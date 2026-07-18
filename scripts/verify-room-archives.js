#!/usr/bin/env node
// verify-room-archives.js
// Enforces archive backup rules before Phase 2 room integration.
// Run: node scripts/verify-room-archives.js
// Or:  npm run verify:room-archives

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LIVE_DIR = path.join(__dirname, '..', 'assets', 'images');
const ARCHIVE_DIR = path.join(LIVE_DIR, 'archive');
const MIN_SIZE_BYTES = 1024 * 1024; // 1 MB

function sha256(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function formatBytes(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  return n + ' bytes';
}

// Collect all live bg-*.png files
const liveFiles = fs
  .readdirSync(LIVE_DIR)
  .filter(f => f.startsWith('bg-') && f.endsWith('.png'))
  .sort();

if (liveFiles.length === 0) {
  console.error('\n❌ No bg-*.png files found in assets/images/ — check your working directory.');
  process.exit(1);
}

let allOk = true;
const results = [];

for (const filename of liveFiles) {
  const livePath = path.join(LIVE_DIR, filename);
  const archivePath = path.join(ARCHIVE_DIR, filename);

  const liveSize = fs.statSync(livePath).size;

  // Check 1: archive file exists
  if (!fs.existsSync(archivePath)) {
    results.push({ ok: false, filename, reason: 'MISSING from archive' });
    allOk = false;
    continue;
  }

  const archiveSize = fs.statSync(archivePath).size;

  // Check 2: archive file is not a stub (must be >= 1 MB)
  if (archiveSize < MIN_SIZE_BYTES) {
    results.push({
      ok: false,
      filename,
      reason: `archive is ${formatBytes(archiveSize)} — LFS pointer stub, not a real PNG`,
    });
    allOk = false;
    continue;
  }

  // Check 3: SHA-256 of live and archive must match
  const liveSha = sha256(livePath);
  const archiveSha = sha256(archivePath);

  if (liveSha !== archiveSha) {
    results.push({
      ok: false,
      filename,
      reason: `SHA mismatch\n    live:    ${liveSha}\n    archive: ${archiveSha}`,
    });
    allOk = false;
    continue;
  }

  results.push({ ok: true, filename, size: archiveSize });
}

// Print results
console.log('');
for (const r of results) {
  if (r.ok) {
    console.log(`✅ ${r.filename.padEnd(40)} ${formatBytes(r.size)}`);
  } else {
    console.log(`❌ ${r.filename} — ${r.reason}`);
  }
}

console.log('');

if (allOk) {
  console.log(`✅ ALL ${liveFiles.length} ARCHIVE FILES MATCH LIVE — Phase 2 may proceed.`);
  process.exit(0);
} else {
  const failures = results.filter(r => !r.ok).length;
  console.log(`❌ ${failures} of ${liveFiles.length} archive checks FAILED.`);
  console.log('❌ DO NOT START PHASE 2 — fix archive backups first.');
  console.log('');
  console.log('Fix: run git lfs pull, then cp assets/images/bg-*.png assets/images/archive/');
  console.log('See docs/ASSET_BACKUP_RULES.md for the full procedure.');
  process.exit(1);
}
