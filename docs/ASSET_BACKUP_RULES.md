# Asset Backup Rules

This document defines the backup requirements for all room background PNGs before any Phase 2 compositing work begins.

## The Rule

**Every file in `assets/images/bg-*.png` must have a matching backup in `assets/images/archive/` before any composite is applied.**

The backup must:
- Have the exact same filename as the live file
- Be a real PNG (minimum 1 MB — not a Git LFS pointer stub)
- Have an identical SHA-256 hash to the live file

## Why This Matters

Git LFS stores binary files as pointer stubs on disk until explicitly pulled. A naive `cp` of an LFS-tracked file copies the pointer (86–95 bytes), not the real image. This creates a fake backup that cannot restore the original artwork.

The verification script (`scripts/verify-room-archives.js`) enforces all three rules above and blocks Phase 2 if any check fails.

## How to Create Valid Backups

```bash
# Step 1 — pull real binary files from LFS storage
git lfs pull

# Step 2 — confirm one file is MB-sized (not bytes)
ls -lh assets/images/bg-raylene-room-day.png
# Must show ~2.7M

# Step 3 — copy real files to archive
mkdir -p assets/images/archive
cp assets/images/bg-*.png assets/images/archive/

# Step 4 — verify all 28 pass
npm run verify:room-archives

# Step 5 — commit only after verification passes
git add assets/images/archive/
git commit -m "archive: replace stub room backups with real originals"
git push origin main
```

## Verification

```bash
npm run verify:room-archives
```

Expected output when all 28 archives are valid:

```
✅ bg-raylene-room-day.png          2876578 bytes
✅ bg-raylene-room-midday.png       2810555 bytes
... (all 28)

✅ ALL 28 ARCHIVE FILES MATCH LIVE — Phase 2 may proceed.
```

If any file is missing, undersized, or mismatched:

```
❌ bg-raylene-room-day.png — archive is 88 bytes (LFS stub)

❌ DO NOT START PHASE 2 — fix archive backups first.
```

## Rules for the Archive Folder

- `assets/images/archive/` is write-once before Phase 2 begins.
- Do not overwrite archive files with composite outputs.
- Do not delete archive files.
- The archive is used for rollback only — see [PHASE_2_ROOM_INTEGRATION.md](PHASE_2_ROOM_INTEGRATION.md).

## Git LFS and the Archive

The archive PNGs are also tracked by Git LFS. After committing real backups, confirm the push includes LFS objects:

```bash
git lfs push origin main
```

If the remote shows archive files as 86–95 bytes after push, LFS objects did not transfer. Re-push with:

```bash
git lfs push --all origin main
```
