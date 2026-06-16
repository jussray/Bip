#!/usr/bin/env node
// verify-room-archives.js
// Enforces archive backup rules for Phase 2 room integration.
// Run: node scripts/verify-room-archives.js
// Or:  npm run verify:room-archives
//
// DIRECTORY CONTRACT:
//   assets/images/archive/bg-*.png  = original untouched backgrounds (read-only originals)
//   assets/images/bg-*.png          = current live files (may be composites after Phase 2)
//
// WHAT THIS SCRIPT CHECKS:
//   1. Every live bg-*.png has a matching file in archive/
//   2. Every archive file is a real PNG (>= 1 MB — rejects LFS pointer stubs)
//   3. SHA match is INFORMATIONAL only in default mode — live and archive will intentionally
//      differ once Phase 2 composites are pushed.
//
// STRICT MODE (pre-composite validation only):
//   node scripts/verify-room-archives.js --strict-match
//   Fails if live and archive SHA differ. Use this BEFORE pushing any composite.
//
// HOW ARCHIVE STUBS GET FIXED:
//   The archive/ files are LFS pointer stubs when git lfs pull has not been run.
//   Fix locally:
//     git lfs pull
//     cp -f assets/images/bg-*.png assets/images/archive/
//     git add assets/images/archive/
//     git commit -m "fix: replace LFS stub archive copies with real PNG bytes"
//     git push
//   See docs/ASSET_BACKUP_RULES.md

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const LIVE_DIR    = path.join(__dirname, '..', 'assets', 'images');
const ARCHIVE_DIR = path.join(LIVE_DIR, 'archive');
const MIN_SIZE_BYTES = 1024 * 1024; // 1 MB — anything smaller is an LFS pointer stub

const STRICT_MATCH = process.argv.includes('--strict-match');

function sha256(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function isLfsPointer(filepath) {
  // LFS pointer files start with "version https://git-lfs.github.com/spec/"
  // and are always < 200 bytes
  const stat = fs.statSync(filepath);
  if (stat.size > 512) return false;
  try {
    const head = fs.readFileSync(filepath, 'utf8').slice(0, 64);
    return head.startsWith('version https://git-lfs');
  } catch {
    return false;
  }
}

function formatBytes(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
  return n + ' bytes';
}

// ── Collect live bg-*.png files ────────────────────────────────────────────
const liveFiles = fs
  .readdirSync(LIVE_DIR)
  .filter(f => f.startsWith('bg-') && f.endsWith('.png'))
  .sort();

if (liveFiles.length === 0) {
  console.error('\n❌ No bg-*.png files found in assets/images/ — check your working directory.');
  process.exit(1);
}

if (!fs.existsSync(ARCHIVE_DIR)) {
  console.error('\n❌ assets/images/archive/ does not exist.');
  console.error('Create it and copy original backgrounds into it before Phase 2.');
  console.error('See docs/ASSET_BACKUP_RULES.md');
  process.exit(1);
}

// ── Detect environment ─────────────────────────────────────────────────────
// Check if any live files are LFS pointers (lfs pull not run yet)
const liveStubs = liveFiles.filter(f => isLfsPointer(path.join(LIVE_DIR, f)));
if (liveStubs.length > 0) {
  console.error('\n❌ LIVE files are LFS pointer stubs. Run git lfs pull first.');
  console.error(`   Stub count: ${liveStubs.length} of ${liveFiles.length}`);
  console.error('   git lfs pull');
  process.exit(1);
}

// ── Check each file ────────────────────────────────────────────────────────
let allOk = true;
const results = [];
let stubCount = 0;

for (const filename of liveFiles) {
  const livePath    = path.join(LIVE_DIR, filename);
  const archivePath = path.join(ARCHIVE_DIR, filename);

  // Check 1: archive counterpart must exist
  if (!fs.existsSync(archivePath)) {
    results.push({ ok: false, filename, reason: 'MISSING from archive/' });
    allOk = false;
    continue;
  }

  const archiveSize = fs.statSync(archivePath).size;

  // Check 2: detect LFS pointer stub in archive
  if (isLfsPointer(archivePath)) {
    stubCount++;
    results.push({
      ok: false,
      filename,
      reason: `archive is an LFS pointer stub (${archiveSize} bytes).\n    Fix: git lfs pull && cp -f assets/images/${filename} assets/images/archive/${filename}`,
    });
    allOk = false;
    continue;
  }

  // Check 3: archive must be >= 1 MB (belt-and-suspenders for non-LFS small files)
  if (archiveSize < MIN_SIZE_BYTES) {
    results.push({
      ok: false,
      filename,
      reason: `archive is ${formatBytes(archiveSize)} — too small to be a real PNG. Minimum: 1 MB.`,
    });
    allOk = false;
    continue;
  }

  // Check 4 (--strict-match only): SHA must match — use before any composites are pushed
  if (STRICT_MATCH) {
    const liveSha    = sha256(livePath);
    const archiveSha = sha256(archivePath);
    if (liveSha !== archiveSha) {
      results.push({
        ok: false,
        filename,
        reason: `--strict-match: SHA differs (live has been modified from original)\n    live:    ${liveSha}\n    archive: ${archiveSha}`,
      });
      allOk = false;
      continue;
    }
    results.push({ ok: true, filename, size: archiveSize, note: 'identical to archive ✓ (pre-composite)' });
  } else {
    // Default mode: archive exists and is real — sufficient for Phase 2 to proceed
    const liveSha    = sha256(livePath);
    const archiveSha = sha256(archivePath);
    const same = liveSha === archiveSha;
    results.push({
      ok: true,
      filename,
      size: archiveSize,
      note: same ? 'pre-composite (matches original)' : 'composite active ✦',
    });
  }
}

// ── Print results ──────────────────────────────────────────────────────────
console.log('');
console.log(STRICT_MATCH
  ? '── verify-room-archives [--strict-match] ──'
  : '── verify-room-archives ──');
console.log('');

for (const r of results) {
  if (r.ok) {
    console.log(`✅ ${r.filename.padEnd(44)} ${formatBytes(r.size).padStart(9)}  ${r.note || ''}`);
  } else {
    console.log(`❌ ${r.filename}`);
    console.log(`   ${r.reason}`);
  }
}

console.log('');

if (!allOk) {
  const failures = results.filter(r => !r.ok).length;
  console.log(`❌ ${failures} of ${liveFiles.length} archive checks FAILED.`);
  if (stubCount > 0) {
    console.log(`   ${stubCount} LFS pointer stub(s) found in archive/.`);
    console.log('');
    console.log('   ── REPAIR COMMANDS ──────────────────────────────────────────');
    console.log('   git lfs pull');
    console.log('   cp -f assets/images/bg-*.png assets/images/archive/');
    console.log('   git add assets/images/archive/');
    console.log('   git commit -m "fix: replace LFS stub archive copies with real PNG bytes"');
    console.log('   git push');
    console.log('   ─────────────────────────────────────────────────────────────');
    console.log('');
    console.log('   Or run the repair helper:');
    console.log('   node scripts/repair-archive-stubs.js');
  }
  console.log('');
  console.log('❌ DO NOT START PHASE 2 — fix archive backups first.');
  console.log('   See docs/ASSET_BACKUP_RULES.md');
  process.exit(1);
}

const composited = results.filter(r => r.note && r.note.includes('✦')).length;
const pristine   = results.filter(r => r.note && r.note.includes('pre-composite')).length;
console.log(`✅ ${liveFiles.length} of ${liveFiles.length} archive files verified.  All real PNGs >= 1 MB.`);
if (composited > 0) {
  console.log(`   ${composited} composite(s) active  |  ${pristine} still pre-composite`);
} else {
  console.log(`   All ${pristine} files are pre-composite originals.`);
}
if (STRICT_MATCH) {
  console.log('✅ ALL 28 ARCHIVE FILES MATCH LIVE — strict-match passed.');
}
console.log('✅ Phase 2 may proceed.');
process.exit(0);
