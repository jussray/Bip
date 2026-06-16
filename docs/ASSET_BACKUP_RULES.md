# Asset Backup Rules — Room Art

Room backgrounds (`assets/images/bg-*.png`) are the most expensive art asset
in this repo to regenerate. Before any of them can be touched by Phase 2
work, each one must have a verified backup.

## The rule

For every `assets/images/bg-*.png`:

1. A matching file must exist at `assets/images/archive/bg-*.png` (same
   filename).
2. The archive file must be **at least 1 MB**. A URL, a text stub, or any
   other placeholder is not a backup.
3. The archive file's contents must be **byte-identical** to the live file
   (verified by SHA-256 hash, not just file size).

If any of these three conditions fails for any room background, the
backup set is invalid.

## Enforcement

```bash
npm run verify:room-archives
```

This runs [`scripts/verify-room-archives.js`](../scripts/verify-room-archives.js),
which:

- Walks every `assets/images/bg-*.png`.
- Confirms the matching `assets/images/archive/bg-*.png` exists.
- Fails if the archive file is missing.
- Fails if the archive file is under 1 MB.
- Fails if the live and archive SHA-256 hashes don't match.
- Prints `DO NOT START PHASE 2` and exits non-zero if anything above fails.

This script is also part of `npm run verify:prepush`, so a broken backup
set blocks every push, not just a manual check.

## What counts as a real backup

Copying the actual PNG bytes:

```bash
cp assets/images/bg-raylene-room-night.png assets/images/archive/bg-raylene-room-night.png
```

What does **not** count: a text file containing a GitHub raw URL, a git-lfs
pointer, a symlink, or any file under 1 MB. `verify:room-archives` treats
all of those as an invalid backup and will fail loudly.

## Why this exists

Phase 2 room work (re-wiring room backgrounds through Supabase, swapping in
new art, restructuring `constants/theme.ts`'s image map) is destructive if
something goes wrong — there's no undo for a PNG that gets overwritten and
has no real backup. This script is the gate: if it fails, fix the archive
before doing any Phase 2 room integration work. See
[`PHASE_2_ROOM_INTEGRATION.md`](./PHASE_2_ROOM_INTEGRATION.md).
